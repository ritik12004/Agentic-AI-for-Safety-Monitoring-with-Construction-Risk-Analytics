
import os
from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    Integer,
    String,
    create_engine,
)
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    sessionmaker,
)

# PostgreSQL:
# postgresql+psycopg2://user:pass@localhost:5432/safety
# Default is SQLite.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./safety.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
    if DATABASE_URL.startswith("sqlite")
    else {},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False)


class Base(DeclarativeBase):
    pass


# User accounts for Admin and normal users.
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True
    )
    name: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    role: Mapped[str] = mapped_column(
        String(20), default="user", nullable=False
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )


# Existing assessment records.
class Assessment(Base):
    __tablename__ = "assessments"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True
    )
    image_id: Mapped[str] = mapped_column(
        String(64), unique=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
    rainfall_mm: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    wind_speed_kmh: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    temperature_c: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    detection_count: Mapped[int] = mapped_column(
        Integer, default=0
    )
    detection_score: Mapped[int] = mapped_column(
        Integer, default=0
    )
    combined_score: Mapped[int] = mapped_column(
        Integer, default=0
    )
    risk_level: Mapped[str] = mapped_column(String(16))
    compliance_status: Mapped[str] = mapped_column(
        String(32)
    )
    detections: Mapped[list] = mapped_column(
        JSON, default=list
    )
    findings: Mapped[list] = mapped_column(
        JSON, default=list
    )
    environmental_findings: Mapped[list] = mapped_column(
        JSON, default=list
    )


def init_db():
    # Creates missing tables without deleting existing records.
    Base.metadata.create_all(engine)


def save_assessment(
    image_id,
    environmental_data,
    detections,
    agent_result,
    compliance_result,
):
    env = environmental_data or {}

    row = Assessment(
        image_id=image_id,
        rainfall_mm=env.get("rainfall_mm"),
        wind_speed_kmh=env.get("wind_speed_kmh"),
        temperature_c=env.get("temperature_c"),
        detection_count=len(detections),
        detection_score=agent_result["risk_analysis"]["risk_score"],
        combined_score=agent_result["combined_risk"]["risk_score"],
        risk_level=agent_result["combined_risk"]["risk_level"],
        compliance_status=compliance_result["status"],
        detections=detections,
        findings=agent_result["risk_analysis"]["findings"],
        environmental_findings=agent_result[
            "environmental_analysis"
        ]["findings"],
    )

    with SessionLocal() as session:
        session.add(row)
        session.commit()


def _to_dict(r: Assessment):
    return {
        "image_id": r.image_id,
        "created_at": r.created_at.isoformat(),
        "rainfall_mm": r.rainfall_mm,
        "wind_speed_kmh": r.wind_speed_kmh,
        "temperature_c": r.temperature_c,
        "detection_count": r.detection_count,
        "detection_score": r.detection_score,
        "combined_score": r.combined_score,
        "risk_level": r.risk_level,
        "compliance_status": r.compliance_status,
        "findings": r.findings,
        "environmental_findings": r.environmental_findings,
    }


def list_assessments(limit=50):
    with SessionLocal() as session:
        rows = (
            session.query(Assessment)
            .order_by(Assessment.created_at.desc())
            .limit(limit)
            .all()
        )
        return [_to_dict(r) for r in rows]


from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()


def get_user_by_email(email: str):
    with SessionLocal() as session:
        return session.query(User).filter(
            User.email == email.lower().strip()
        ).first()


def create_user(name: str, email: str, password: str,
                role: str = "user"):
    normalized_email = email.lower().strip()

    with SessionLocal() as session:
        existing = session.query(User).filter(
            User.email == normalized_email
        ).first()

        if existing:
            raise ValueError("An account with this email already exists.")

        user = User(
            name=name.strip(),
            email=normalized_email,
            password_hash=password_hash.hash(password),
            role=role,
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        }


def verify_user_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)


def ensure_admin_account():
    with SessionLocal() as session:
        admin = session.query(User).filter(
            User.email == "admin"
        ).first()

        if admin is None:
            admin = User(
                name="Admin",
                email="admin",
                password_hash=password_hash.hash("admin@123"),
                role="admin",
                is_active=True,
            )
            session.add(admin)
            session.commit()
