"""
관측성 설정 — 메트릭(Prometheus)과 분산 트레이싱(OpenTelemetry → Tempo)

- /metrics: Prometheus 수집용. Traefik은 /ai/v1 경로만 라우팅하므로 외부에 노출되지 않는다.
- 트레이싱: OTEL_EXPORTER_OTLP_ENDPOINT가 있을 때만 켠다(운영 docker-compose에서 설정).
  Spring 백엔드가 WebClient로 호출할 때 보내는 traceparent 헤더를 이어받아, 백엔드 → FastAPI가 한 트레이스로 연결된다.
"""
import os

from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator


def setup_observability(app: FastAPI) -> None:
    Instrumentator(excluded_handlers=["/metrics"]).instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)

    endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
    if not endpoint:
        return

    from opentelemetry import trace
    from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    from opentelemetry.sdk.resources import Resource
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor

    provider = TracerProvider(resource=Resource.create({
        "service.name": os.getenv("OTEL_SERVICE_NAME", "yaksok-fastapi"),
        "project": "yaksok",
    }))
    provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))  # 엔드포인트는 OTEL_EXPORTER_OTLP_ENDPOINT
    trace.set_tracer_provider(provider)
    FastAPIInstrumentor.instrument_app(app, excluded_urls="metrics")
