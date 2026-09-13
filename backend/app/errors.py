"""
Error handling.

The user never sees a stack trace. Every failure becomes a short JSON
message with the right status code.
"""
import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class PredictionUnavailable(Exception):
    """The model is not loaded, so no score can be produced."""


class RoutingUnavailable(Exception):
    """OSRM is down, or there is no road route between the two points."""


def _json(status: int, message: str, detail: str | None = None) -> JSONResponse:
    body = {"error": message}
    if detail:
        body["detail"] = detail
    return JSONResponse(status_code=status, content=body)


def register_error_handlers(app: FastAPI) -> None:

    @app.exception_handler(PredictionUnavailable)
    async def _prediction_unavailable(request: Request, exc: PredictionUnavailable):
        # 503 not 500: the service is fine, it is just missing the model
        return _json(503, "Prediction service unavailable", str(exc))

    @app.exception_handler(RoutingUnavailable)
    async def _routing_unavailable(request: Request, exc: RoutingUnavailable):
        # 502: we are the gateway and the upstream service failed
        return _json(502, "Could not find a route between these points", str(exc))

    @app.exception_handler(Exception)
    async def _unexpected(request: Request, exc: Exception):
        # Log the real error for us, return a safe message to the user
        logger.exception("Unhandled error on %s", request.url.path)
        return _json(500, "Something went wrong")
