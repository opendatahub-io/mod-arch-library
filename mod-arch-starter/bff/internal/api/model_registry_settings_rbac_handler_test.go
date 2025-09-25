//go:build ignore

package api

// RBAC handler tests removed.
			Expect(err).NotTo(HaveOccurred())

			var actual RoleBindingEnvelope
			err = json.Unmarshal(body, &actual)
			Expect(err).NotTo(HaveOccurred())

			Expect(rr.Code).To(Equal(http.StatusCreated))
			Expect(actual.Data.Name).To(Equal("test-role-binding"))
			Expect(actual.Data.Subjects[0].Name).To(Equal("test-user@example.com"))
		})

		It("should patch a role binding", func() {
			updatedRoleBinding := models.RoleBinding{
				ObjectMeta: metav1.ObjectMeta{
					Name: "test-role-binding",
				},
				Subjects: []rbacv1.Subject{
					{
						Kind: "User",
						Name: "updated-user@example.com",
					},
				},
				RoleRef: rbacv1.RoleRef{
					Kind:     "ClusterRole",
					Name:     "edit",
					APIGroup: "rbac.authorization.k8s.io",
				},
			}

			reqBody, err := json.Marshal(RoleBindingEnvelope{Data: updatedRoleBinding})
			Expect(err).NotTo(HaveOccurred())

			req, err := http.NewRequest(http.MethodPatch, RoleBindingListPath+"/test-role-binding?namespace=kubeflow", bytes.NewReader(reqBody))
			Expect(err).NotTo(HaveOccurred())
			req.Header.Set("Content-Type", "application/json")

			ctx := context.WithValue(req.Context(), constants.RequestIdentityKey, &kubernetes.RequestIdentity{
				UserID: "user@example.com",
			})
			ctx = context.WithValue(ctx, constants.NamespaceHeaderParameterKey, "kubeflow")
			req = req.WithContext(ctx)

			rr := httptest.NewRecorder()
			// We need to simulate the router params since we're calling the handler directly
			ps := httprouter.Params{
				{Key: RoleBindingNameParam, Value: "test-role-binding"},
			}
			testApp.PatchRoleBindingHandler(rr, req, ps)

			rs := rr.Result()
			defer rs.Body.Close()
			body, err := io.ReadAll(rs.Body)
			Expect(err).NotTo(HaveOccurred())

			var actual RoleBindingEnvelope
			err = json.Unmarshal(body, &actual)
			Expect(err).NotTo(HaveOccurred())

			Expect(rr.Code).To(Equal(http.StatusOK))
			Expect(actual.Data.Name).To(Equal("test-role-binding"))
			Expect(actual.Data.Subjects[0].Name).To(Equal("updated-user@example.com"))
			Expect(actual.Data.RoleRef.Name).To(Equal("edit"))
		})

		It("should delete a role binding", func() {
			req, err := http.NewRequest(http.MethodDelete, RoleBindingListPath+"/test-role-binding?namespace=kubeflow", nil)
			Expect(err).NotTo(HaveOccurred())

			ctx := context.WithValue(req.Context(), constants.RequestIdentityKey, &kubernetes.RequestIdentity{
				UserID: "user@example.com",
			})
			ctx = context.WithValue(ctx, constants.NamespaceHeaderParameterKey, "kubeflow")
			req = req.WithContext(ctx)

			rr := httptest.NewRecorder()
			// We need to simulate the router params since we're calling the handler directly
			ps := httprouter.Params{
				{Key: RoleBindingNameParam, Value: "test-role-binding"},
			}
			testApp.DeleteRoleBindingHandler(rr, req, ps)

			rs := rr.Result()
			defer rs.Body.Close()

			Expect(rr.Code).To(Equal(http.StatusNoContent))
		})
	})
})
