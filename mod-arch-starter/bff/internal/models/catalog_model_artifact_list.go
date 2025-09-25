//go:build ignore

package models

type CatalogModelArtifact struct {
	CreateTimeSinceEpoch     *string `json:"createTimeSinceEpoch,omitempty"`
	LastUpdateTimeSinceEpoch *string `json:"lastUpdateTimeSinceEpoch,omitempty"`
	Uri                      string  `json:"uri"`
	CustomProperties         any     `json:"customProperties,omitempty"`
}

type CatalogModelArtifactList struct {
	NextPageToken string                 `json:"nextPageToken"`
	PageSize      int32                  `json:"pageSize"`
	Size          int32                  `json:"size"`
	Items         []CatalogModelArtifact `json:"items"`
}
