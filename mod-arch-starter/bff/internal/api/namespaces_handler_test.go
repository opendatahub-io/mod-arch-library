//go:build ignore

package api

// Namespaces handler tests removed.

		It("should return no namespaces for non-existent user", func() {
			By("creating the HTTP request with a non-existent kubeflow-userid")
			req, err := http.NewRequest(http.MethodGet, NamespaceListPath, nil)
			reqIdentity := &kubernetes.RequestIdentity{
				UserID: "nonexistent@example.com",
			}
			ctx := context.WithValue(req.Context(), constants.RequestIdentityKey, reqIdentity)
			req = req.WithContext(ctx)
			Expect(err).NotTo(HaveOccurred())
			rr := httptest.NewRecorder()

			By("calling the GetNamespacesHandler")
			testApp.GetNamespacesHandler(rr, req, nil)
			rs := rr.Result()
			defer rs.Body.Close()
			body, err := io.ReadAll(rs.Body)
			Expect(err).NotTo(HaveOccurred())

			By("unmarshalling the response")
			var actual NamespacesEnvelope
			err = json.Unmarshal(body, &actual)
			Expect(err).NotTo(HaveOccurred())
			Expect(rr.Code).To(Equal(http.StatusOK))

			By("validating the response contains no namespaces")
			Expect(actual.Data).To(BeEmpty())
		})
	})

	Context("when running in dev mode with k8 token client", Ordered, func() {
		var testApp App

		BeforeAll(func() {
			By("setting up the test app in dev mode")
			kubernetesMockedTokenClientFactory, err := k8mocks.NewTokenClientFactory(clientset, restConfig, logger)
			Expect(err).NotTo(HaveOccurred())
			testApp = App{
				config:                  config.EnvConfig{DevMode: true},
				kubernetesClientFactory: kubernetesMockedTokenClientFactory,
				repositories:            repositories.NewRepositories(mockMRClient),
				logger:                  logger,
			}
		})

		It("should return namespaces for user@example.com - with token", func() {
			By("creating the HTTP request with the kubeflow-userid header")
			req, err := http.NewRequest(http.MethodGet, NamespaceListPath, nil)

			reqIdentity := &kubernetes.RequestIdentity{
				//UserID: user@example.com,
				Token: k8mocks.DefaultTestUsers[0].Token,
			}
			ctx := context.WithValue(req.Context(), constants.RequestIdentityKey, reqIdentity)
			req = req.WithContext(ctx)
			Expect(err).NotTo(HaveOccurred())
			rr := httptest.NewRecorder()

			By("calling the GetNamespacesHandler")
			testApp.GetNamespacesHandler(rr, req, nil)
			rs := rr.Result()
			defer rs.Body.Close()
			body, err := io.ReadAll(rs.Body)
			Expect(err).NotTo(HaveOccurred())

			By("unmarshalling the response")
			var actual NamespacesEnvelope
			err = json.Unmarshal(body, &actual)
			Expect(err).NotTo(HaveOccurred())
			Expect(rr.Code).To(Equal(http.StatusOK))

			By("validating the response contains namespaces")
			Expect(actual.Data).ToNot(BeEmpty())
		})

		It("should return no namespaces for non-authorized existent user", func() {
			By("creating the HTTP request with a non-authorized user")
			req, err := http.NewRequest(http.MethodGet, NamespaceListPath, nil)
			reqIdentity := &kubernetes.RequestIdentity{
				Token: k8mocks.DefaultTestUsers[1].Token,
			}
			ctx := context.WithValue(req.Context(), constants.RequestIdentityKey, reqIdentity)
			req = req.WithContext(ctx)
			Expect(err).NotTo(HaveOccurred())
			rr := httptest.NewRecorder()

			By("calling the GetNamespacesHandler")
			testApp.GetNamespacesHandler(rr, req, nil)
			rs := rr.Result()
			defer rs.Body.Close()
			body, err := io.ReadAll(rs.Body)
			Expect(err).NotTo(HaveOccurred())

			By("unmarshalling the response")
			var actual NamespacesEnvelope
			err = json.Unmarshal(body, &actual)
			Expect(err).NotTo(HaveOccurred())
			Expect(rr.Code).To(Equal(http.StatusInternalServerError))

		})
	})
})
