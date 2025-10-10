//go:build ignore

package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/julienschmidt/httprouter"
)

// Model Registry handler placeholder removed. File intentionally left blank.

func (app *App) UpdateModelVersionHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	client, ok := r.Context().Value(constants.ModelRegistryHttpClientKey).(mrserver.HTTPClientInterface)
	if !ok {
		app.serverErrorResponse(w, r, errors.New("REST client not found"))
		return
	}

	var envelope ModelVersionUpdateEnvelope
	if err := json.NewDecoder(r.Body).Decode(&envelope); err != nil {
		app.serverErrorResponse(w, r, fmt.Errorf("error decoding JSON:: %v", err.Error()))
		return
	}

	data := *envelope.Data

	//TODO add validation - note updating requires different rules to create as fields are optional.

	jsonData, err := json.Marshal(data)
	if err != nil {
		app.serverErrorResponse(w, r, fmt.Errorf("error marshaling ModelVersion to JSON: %w", err))
		return
	}

	patchedModel, err := app.repositories.ModelRegistryClient.UpdateModelVersion(client, ps.ByName(ModelVersionId), jsonData)
	if err != nil {
		var httpErr *mrserver.HTTPError
		if errors.As(err, &httpErr) {
			app.errorResponse(w, r, httpErr)
		} else {
			app.serverErrorResponse(w, r, err)
		}
		return
	}

	if patchedModel == nil {
		app.serverErrorResponse(w, r, fmt.Errorf("patched ModelVersion is nil"))
		return
	}

	responseBody := ModelVersionEnvelope{
		Data: patchedModel,
	}

	err = app.WriteJSON(w, http.StatusOK, responseBody, nil)
	if err != nil {
		app.serverErrorResponse(w, r, fmt.Errorf("error writing JSON"))
		return
	}
}

func (app *App) GetAllModelArtifactsByModelVersionHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	client, ok := r.Context().Value(constants.ModelRegistryHttpClientKey).(mrserver.HTTPClientInterface)
	if !ok {
		app.serverErrorResponse(w, r, errors.New("REST client not found"))
		return
	}

	data, err := app.repositories.ModelRegistryClient.GetModelArtifactsByModelVersion(client, ps.ByName(ModelVersionId), r.URL.Query())
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	result := ModelArtifactListEnvelope{
		Data: data,
	}

	err = app.WriteJSON(w, http.StatusOK, result, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

func (app *App) CreateModelArtifactByModelVersionHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	client, ok := r.Context().Value(constants.ModelRegistryHttpClientKey).(mrserver.HTTPClientInterface)
	if !ok {
		app.serverErrorResponse(w, r, errors.New("REST client not found"))
		return
	}

	var envelope ModelArtifactEnvelope
	if err := json.NewDecoder(r.Body).Decode(&envelope); err != nil {
		app.serverErrorResponse(w, r, fmt.Errorf("error decoding JSON:: %v", err.Error()))
		return
	}

	data := *envelope.Data

	if err := validation.ValidateModelArtifact(data); err != nil {
		app.badRequestResponse(w, r, fmt.Errorf("validation error:: %v", err.Error()))
		return
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		app.serverErrorResponse(w, r, fmt.Errorf("error marshaling ModelVersion to JSON: %w", err))
		return
	}

	createdArtifact, err := app.repositories.ModelRegistryClient.CreateModelArtifactByModelVersion(client, ps.ByName(ModelVersionId), jsonData)
	if err != nil {
		var httpErr *mrserver.HTTPError
		if errors.As(err, &httpErr) {
			app.errorResponse(w, r, httpErr)
		} else {
			app.serverErrorResponse(w, r, err)
		}
		return
	}

	if createdArtifact == nil {
		app.serverErrorResponse(w, r, fmt.Errorf("created ModelArtifact is nil"))
		return
	}

	response := ModelArtifactEnvelope{
		Data: createdArtifact,
	}

	w.Header().Set("Location", ParseURLTemplate(ModelArtifactPath, map[string]string{
		ModelRegistryId: ps.ByName(ModelRegistryId),
		ModelArtifactId: createdArtifact.GetId(),
	}))
	err = app.WriteJSON(w, http.StatusCreated, response, nil)
	if err != nil {
		app.serverErrorResponse(w, r, fmt.Errorf("error writing JSON"))
		return
	}
}
