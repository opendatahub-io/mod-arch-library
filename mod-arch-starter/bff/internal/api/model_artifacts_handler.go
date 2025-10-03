//go:build ignore

package api

// Fully deprecated stub: original model artifacts handler contents removed.

	err = app.WriteJSON(w, http.StatusOK, responseBody, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}
