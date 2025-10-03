package tests

import (
	"net/http"
	"testing"

	"github.com/kubeflow/mod-arch/ui/bff/internal/config"
	"github.com/kubeflow/mod-arch/ui/bff/internal/integrations/kubernetes"
)

func TestTokenClientFactoryExtractRequestIdentity(t *testing.T) {
	// with Bearer prefix
	factory := &kubernetes.TokenClientFactory{Header: config.DefaultAuthTokenHeader, Prefix: config.DefaultAuthTokenPrefix}
	header := http.Header{}
	header.Set("Authorization", "Bearer doratoken")
	identity, err := factory.ExtractRequestIdentity(header)
	if err != nil || identity.Token != "doratoken" {
		t.Fatalf("expected doratoken got %#v err=%v", identity, err)
	}

	// prefix mismatch
	header = http.Header{}
	header.Set("Authorization", "Token bellatoken")
	if _, err := factory.ExtractRequestIdentity(header); err == nil {
		t.Fatalf("expected error for wrong prefix")
	}

	// missing prefix
	header = http.Header{}
	header.Set("Authorization", "doratoken")
	if _, err := factory.ExtractRequestIdentity(header); err == nil {
		t.Fatalf("expected error for missing prefix")
	}

	// missing header
	header = http.Header{}
	if _, err := factory.ExtractRequestIdentity(header); err == nil {
		t.Fatalf("expected error for missing header")
	}

	// no prefix mode
	factory = &kubernetes.TokenClientFactory{Header: "X-Forwarded-Access-Token", Prefix: ""}
	header = http.Header{}
	header.Set("X-Forwarded-Access-Token", "bellatoken")
	identity, err = factory.ExtractRequestIdentity(header)
	if err != nil || identity.Token != "bellatoken" {
		t.Fatalf("expected bellatoken got %#v err=%v", identity, err)
	}

	// missing header in no prefix
	header = http.Header{}
	if _, err := factory.ExtractRequestIdentity(header); err == nil {
		t.Fatalf("expected error for missing header (no prefix)")
	}

	// wrong header name
	header = http.Header{}
	header.Set("X-WRONG-Access-Token", "bellatoken")
	if _, err := factory.ExtractRequestIdentity(header); err == nil {
		t.Fatalf("expected error for wrong header name")
	}
}
