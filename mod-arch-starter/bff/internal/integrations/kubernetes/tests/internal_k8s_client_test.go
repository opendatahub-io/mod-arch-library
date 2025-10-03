//go:build ignore

package tests

// Kubernetes internal client tests removed.
			Expect(allowed).To(BeTrue(), "Access should be allowed for the DoraServiceGroup group")
		})

		It("should allow access when one group exists and the other does not", func() {
			identity := &kubernetes.RequestIdentity{
				UserID: existingUser,
				Groups: []string{mocks2.DefaultTestUsers[1].Groups[1], "non-existent-group"},
			}
			serviceAccountMockedK8client, err := kubernetesMockedStaticClientFactory.GetClient(mocks.NewMockSessionContextNoParent())
			Expect(err).NotTo(HaveOccurred())

			allowed, err := serviceAccountMockedK8client.CanAccessServiceInNamespace(ctx, identity, namespace, serviceName)
			Expect(err).NotTo(HaveOccurred())
			Expect(allowed).To(BeTrue(), "Access should be allowed if any group in the list has access")
		})

		It("should allow access only when both service and namespace groups are present\"", func() {
			serviceOnly := &kubernetes.RequestIdentity{
				UserID: existingUser,
				Groups: []string{mocks2.DefaultTestUsers[1].Groups[1]},
			}
			bothGroups := &kubernetes.RequestIdentity{
				UserID: existingUser,
				Groups: mocks2.DefaultTestUsers[1].Groups,
			}
			serviceAccountMockedK8client, err := kubernetesMockedStaticClientFactory.GetClient(mocks.NewMockSessionContextNoParent())
			Expect(err).NotTo(HaveOccurred())

			allowed, err := serviceAccountMockedK8client.CanAccessServiceInNamespace(ctx, serviceOnly, namespace, serviceName)
			Expect(err).NotTo(HaveOccurred())
			Expect(allowed).To(BeTrue(), "Access should be allowed for the DoraServiceGroup group")

			allowed, err = serviceAccountMockedK8client.CanListServicesInNamespace(ctx, serviceOnly, namespace)
			Expect(err).NotTo(HaveOccurred())
			Expect(allowed).To(BeFalse(), "Access should not be allowed for only DoraServiceGroup group")

			allowed, err = serviceAccountMockedK8client.CanListServicesInNamespace(ctx, bothGroups, namespace)
			Expect(err).NotTo(HaveOccurred())
			Expect(allowed).To(BeTrue(), "Access should be allowed for both groups")

			allowed, err = serviceAccountMockedK8client.CanAccessServiceInNamespace(ctx, bothGroups, namespace, serviceName)
			Expect(err).NotTo(HaveOccurred())
			Expect(allowed).To(BeTrue(), "Access should be allowed for for both groups")

		})
	})
})
