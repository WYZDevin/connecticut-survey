import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class PairOut(BaseModel):
    pairId: str
    leftImageUrl: str
    rightImageUrl: str


class SessionCreateResponse(BaseModel):
    sessionId: uuid.UUID
    expiresAt: datetime
    pairs: list[PairOut]


class ComparisonIn(BaseModel):
    pairId: str
    promptId: Literal["flood", "heatwave", "wildfire", "crime", "transport", "noise"]
    choice: Literal["left", "equal", "right"]


class SubmitRequest(BaseModel):
    # Consent is signified by clicking "I agree"; no initials are collected.
    consentInitials: str = Field(default="", max_length=20)
    paymentOptOutInitials: str = Field(default="", max_length=20)
    identifier: str = Field(min_length=1, max_length=200)
    surveyPhase: int
    demographic: dict[str, str]
    climate: dict[str, int]
    stress: dict[str, int]
    durationSeconds: int = Field(ge=0)
    comparisons: list[ComparisonIn]


class SubmitResponse(BaseModel):
    ok: bool = True
