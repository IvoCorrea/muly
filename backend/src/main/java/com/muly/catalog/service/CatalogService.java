package com.muly.catalog.service;

import com.muly.catalog.dto.AlbumDetailResponse;
import com.muly.catalog.dto.AlbumResponse;
import com.muly.catalog.dto.AlbumTrackResponse;
import com.muly.catalog.dto.TrackSearchResponse;
import com.muly.catalog.model.Album;
import com.muly.catalog.repository.AlbumRepository;
import com.muly.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CatalogService {

    private final AlbumRepository albumRepository;
    private final SpotifyService spotifyService;

    public CatalogService(AlbumRepository albumRepository, SpotifyService spotifyService) {
        this.albumRepository = albumRepository;
        this.spotifyService = spotifyService;
    }

    @Transactional(readOnly = true)
    public List<AlbumResponse> searchAlbums(String query) {
        List<AlbumResponse> spotifyResults = spotifyService.searchAlbums(query);
        return spotifyResults.stream().map(result -> {
            Optional<Album> existing = albumRepository.findByExternalId(result.externalId());
            return existing.map(this::toResponse).orElse(result);
        }).toList();
    }

    public List<TrackSearchResponse> searchTracks(String query) {
        return spotifyService.searchTracksWithPreview(query);
    }

    @Transactional
    public AlbumDetailResponse getAlbumByExternalId(String externalId) {
        Optional<Album> existingOpt = albumRepository.findByExternalId(externalId);
        Album album;

        AlbumDetailResponse spotifyDetail = spotifyService.getAlbumDetails(externalId);

        if (existingOpt.isPresent()) {
            album = existingOpt.get();
        } else if (spotifyDetail != null) {
            Album newAlbum = Album.builder()
                    .externalId(spotifyDetail.externalId())
                    .title(spotifyDetail.title())
                    .artist(spotifyDetail.artist())
                    .releaseYear(spotifyDetail.releaseYear())
                    .coverUrl(spotifyDetail.coverUrl())
                    .build();
            album = albumRepository.save(newAlbum);
        } else {
            throw new ResourceNotFoundException("Album not found with external id: " + externalId);
        }

        List<AlbumTrackResponse> tracks = spotifyDetail != null ? spotifyDetail.tracks() : Collections.emptyList();

        return new AlbumDetailResponse(
                album.getId(),
                album.getExternalId(),
                album.getTitle(),
                album.getArtist(),
                album.getReleaseYear(),
                album.getCoverUrl(),
                tracks
        );
    }

    @Transactional
    public AlbumResponse getOrCreateAlbum(String externalId) {
        Optional<Album> existing = albumRepository.findByExternalId(externalId);
        if (existing.isPresent()) {
            return toResponse(existing.get());
        }

        AlbumDetailResponse spotifyDetail = spotifyService.getAlbumDetails(externalId);
        if (spotifyDetail == null) {
            throw new ResourceNotFoundException("Album not found in Spotify catalog: " + externalId);
        }

        Album album = Album.builder()
                .externalId(spotifyDetail.externalId())
                .title(spotifyDetail.title())
                .artist(spotifyDetail.artist())
                .releaseYear(spotifyDetail.releaseYear())
                .coverUrl(spotifyDetail.coverUrl())
                .build();

        Album saved = albumRepository.save(album);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public AlbumResponse getAlbumById(UUID id) {
        Album album = albumRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Album not found with id: " + id));
        return toResponse(album);
    }

    @Transactional(readOnly = true)
    public Album getAlbumEntityById(UUID id) {
        return albumRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Album not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public List<AlbumResponse> findLocalAlbumsByArtist(String artistName) {
        if (artistName == null || artistName.isBlank()) {
            return List.of();
        }
        return albumRepository.findByArtistContainingIgnoreCaseOrderByReleaseYearDesc(artistName.trim())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public AlbumResponse toResponse(Album album) {
        return new AlbumResponse(
                album.getId(),
                album.getExternalId(),
                album.getTitle(),
                album.getArtist(),
                album.getReleaseYear(),
                album.getCoverUrl()
        );
    }
}
