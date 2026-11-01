package com.muly.catalog.controller;

import com.muly.catalog.dto.AlbumDetailResponse;
import com.muly.catalog.dto.AlbumResponse;
import com.muly.catalog.service.CatalogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/catalog")
public class CatalogController {

    private final CatalogService catalogService;

    public CatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/search")
    public ResponseEntity<List<AlbumResponse>> search(@RequestParam(value = "q", defaultValue = "") String query) {
        List<AlbumResponse> results = catalogService.searchAlbums(query);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/albums/{spotifyId}")
    public ResponseEntity<AlbumDetailResponse> getAlbum(@PathVariable String spotifyId) {
        AlbumDetailResponse album = catalogService.getAlbumByExternalId(spotifyId);
        return ResponseEntity.ok(album);
    }
}
