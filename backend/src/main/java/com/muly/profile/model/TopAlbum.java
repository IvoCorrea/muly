package com.muly.profile.model;

import com.muly.auth.model.User;
import com.muly.catalog.model.Album;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(
        name = "top_albums",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_top_albums_user_position", columnNames = {"user_id", "position"}),
                @UniqueConstraint(name = "uk_top_albums_user_album", columnNames = {"user_id", "album_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopAlbum {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "album_id", nullable = false)
    private Album album;

    @Column(nullable = false)
    private Integer position;
}
