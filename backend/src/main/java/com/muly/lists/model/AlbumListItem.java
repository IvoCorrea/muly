package com.muly.lists.model;

import com.muly.catalog.model.Album;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(
        name = "album_list_items",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_album_list_items_list_album", columnNames = {"list_id", "album_id"}),
                @UniqueConstraint(name = "uk_album_list_items_list_position", columnNames = {"list_id", "position"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlbumListItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "list_id", nullable = false)
    private AlbumList albumList;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "album_id", nullable = false)
    private Album album;

    @Column(nullable = false)
    private Integer position;
}
