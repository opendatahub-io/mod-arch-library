//go:build ignore

package api

// Deprecated stub: group settings handler removed.

	err = app.WriteJSON(w, http.StatusOK, resp, nil)

	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}
