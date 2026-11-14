package com.muly.catalog.controller;

import com.muly.catalog.dto.AlbumDetailResponse;
import com.muly.catalog.dto.AlbumResponse;
import com.muly.catalog.dto.ArtistDetailResponse;
import com.muly.catalog.dto.RankedAlbumResponse;
import com.muly.catalog.dto.TrackSearchResponse;
import com.muly.catalog.service.CatalogService;
import com.muly.reviews.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/catalog")
public class CatalogController {

    private final CatalogService catalogService;
    private final ReviewService reviewService;

    public CatalogController(CatalogService catalogService) {
        this(catalogService, null);
    }

    @Autowired
    public CatalogController(CatalogService catalogService, ReviewService reviewService) {
        this.catalogService = catalogService;
        this.reviewService = reviewService;
    }

    @GetMapping("/search")
    public ResponseEntity<List<AlbumResponse>> search(@RequestParam(value = "q", defaultValue = "") String query) {
        List<AlbumResponse> results = catalogService.searchAlbums(query);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/tracks/search")
    public ResponseEntity<List<TrackSearchResponse>> searchTracks(@RequestParam(value = "q", defaultValue = "") String query) {
        List<TrackSearchResponse> results = catalogService.searchTracks(query);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/albums/{spotifyId}")
    public ResponseEntity<AlbumDetailResponse> getAlbum(@PathVariable String spotifyId) {
        AlbumDetailResponse album = catalogService.getAlbumByExternalId(spotifyId);
        return ResponseEntity.ok(album);
    }

    @GetMapping("/ranking")
    public ResponseEntity<List<RankedAlbumResponse>> getCommunityRanking(
            @RequestParam(value = "limit", defaultValue = "50") int limit
    ) {
        List<RankedAlbumResponse> ranking = reviewService != null ? reviewService.getTopRankedAlbums(limit) : List.of();
        return ResponseEntity.ok(ranking);
    }

    @GetMapping("/artists/{artistName}")
    public ResponseEntity<ArtistDetailResponse> getArtistDetail(@PathVariable String artistName) {
        if (reviewService == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(reviewService.getArtistDetail(artistName));
    }
}
