//go:build ignore

package api

// Groups handler tests removed.
			Expect(firstGroup.Users).To(ConsistOf("dora-user@example.com", "dora-admin@example.com"))

			// Verify second group
			secondGroup := actual.Data[1]
			Expect(secondGroup.Metadata.Name).To(Equal("bella-group-mock"))
			Expect(secondGroup.Users).To(ConsistOf("bella-user@example.com", "bella-maintainer@example.com"))
		})
	})
})
