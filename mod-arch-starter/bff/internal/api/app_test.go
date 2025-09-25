package api

import (
	"io"
	"net/http"
	httptest "net/http/httptest"
	"testing"

	"github.com/kubeflow/mod-arch/ui/bff/internal/config"
	"github.com/kubeflow/mod-arch/ui/bff/internal/repositories"
)

func TestStaticFileServing(t *testing.T) {
	// Use static-local-run which exists in repo
	// From internal/api to project root: ../.. then static-local-run
	envConfig := config.EnvConfig{StaticAssetsDir: "../../static-local-run"}
	app := &App{config: envConfig, repositories: repositories.NewRepositories()}
	server := httptest.NewServer(app.Routes())
	defer server.Close()

	// Request a non-existent path to exercise SPA fallback to index.html
	resp, err := http.Get(server.URL + "/__fallback_test__")
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 got %d", resp.StatusCode)
	}
	body, _ := io.ReadAll(resp.Body)
	if len(body) == 0 {
		t.Fatalf("expected body content")
	}
}
