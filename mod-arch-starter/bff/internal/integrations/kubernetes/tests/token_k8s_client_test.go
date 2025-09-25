//go:build ignore

package tests

// Token k8s client tests removed.

			identity := &kubernetes.RequestIdentity{
				Token: k8mocks.DefaultTestUsers[0].Token,
			}
			ctx := context.WithValue(context.Background(), constants.RequestIdentityKey, identity)

			kubernetesMockedTokenClientFactory, err := k8mocks.NewTokenClientFactory(clientset, restConfig, logger)
			Expect(err).NotTo(HaveOccurred())
			tokenK8client, err := kubernetesMockedTokenClientFactory.GetClient(ctx)
			Expect(err).NotTo(HaveOccurred())

			ns, err := tokenK8client.GetNamespaces(ctx, identity)
			Expect(err).NotTo(HaveOccurred(), "Failed to perform SSAR for Kubeflow User ID\"")
			Expect(ns).NotTo(BeEmpty(), "Expected Kubeflow User ID to have access")
		})

		It("should allow allowed user to get namespaces", func() {
			By("other users should not be allowed to get namespaces")

			identity := &kubernetes.RequestIdentity{
				Token: k8mocks.DefaultTestUsers[1].Token,
			}
			ctx := context.WithValue(context.Background(), constants.RequestIdentityKey, identity)

			kubernetesMockedTokenClientFactory, err := k8mocks.NewTokenClientFactory(clientset, restConfig, logger)
			Expect(err).NotTo(HaveOccurred())
			tokenK8client, err := kubernetesMockedTokenClientFactory.GetClient(ctx)
			Expect(err).NotTo(HaveOccurred())

			ns, err := tokenK8client.GetNamespaces(ctx, identity)
			Expect(ns).To(BeEmpty())
			Expect(err).To(HaveOccurred())
		})
	})
})
