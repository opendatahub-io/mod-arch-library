//go:build ignore

package api

// Fully deprecated stub test file: model registry handler tests removed.

			By("creating the http test infrastructure")
			requestPath := fmt.Sprintf(" %s?namespace=kubeflow", ModelRegistryListPath)
			req, err := http.NewRequest(http.MethodGet, requestPath, nil)

			ctx := mocks.NewMockSessionContext(req.Context())
			ctx = context.WithValue(ctx, constants.NamespaceHeaderParameterKey, "kubeflow")
			req = req.WithContext(ctx)

			Expect(err).NotTo(HaveOccurred())
			rr := httptest.NewRecorder()

			By("creating the http request for the handler")
			testApp.GetAllModelRegistriesHandler(rr, req, nil)
			rs := rr.Result()
			defer rs.Body.Close()
			body, err := io.ReadAll(rs.Body)
			Expect(err).NotTo(HaveOccurred())

			By("unmarshalling the model registries")
			var actual ModelRegistryListEnvelope
			err = json.Unmarshal(body, &actual)
			Expect(err).NotTo(HaveOccurred())
			Expect(rr.Code).To(Equal(http.StatusOK))

			By("should match the expected model registries")
			var expected = []models.ModelRegistryModel{
				{Name: "model-registry", Description: "Model Registry Description", DisplayName: "Model Registry", ServerAddress: "http://127.0.0.1:8080/api/model_registry/v1alpha3"},
				{Name: "model-registry-one", Description: "Model Registry One description", DisplayName: "Model Registry One", ServerAddress: "http://127.0.0.1:8080/api/model_registry/v1alpha3"},
			}
			Expect(actual.Data).To(ConsistOf(expected))
		})

	})
})
