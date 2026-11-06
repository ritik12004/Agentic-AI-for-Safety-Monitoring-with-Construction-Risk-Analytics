
import os
from datetime import datetime, timezone

from sqlalchemy import (
    JSON, Boolean, DateTime, Float, ForeignKey,
    Integer, String, create_engine
)
from sqlalchemy.orm import (
    DeclarativeBase, Mapped, mapped_column, sessionmaker
)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./safety.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
    if DATABASE_URL.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="user", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Assessment(Base):
    __tablename__ = "assessments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    image_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
    rainfall_mm: Mapped[float | None] = mapped_column(Float, nullable=True)
    wind_speed_kmh: Mapped[float | None] = mapped_column(Float, nullable=True)
    temperature_c: Mapped[float | None] = mapped_column(Float, nullable=True)
    detection_count: Mapped[int] = mapped_column(Integer, default=0)
    detection_score: Mapped[int] = mapped_column(Integer, default=0)
    combined_score: Mapped[int] = mapped_column(Integer, default=0)
    risk_level: Mapped[str] = mapped_column(String(16))
    compliance_status: Mapped[str] = mapped_column(String(32))
    detections: Mapped[list] = mapped_column(JSON, default=list)
    findings: Mapped[list] = mapped_column(JSON, default=list)
    environmental_findings: Mapped[list] = mapped_column(JSON, default=list)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), index=True, nullable=False
    )
    image_id: Mapped[str] = mapped_column(String(64), index=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    message: Mapped[str] = mapped_column(String(500), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), default="Medium")
    status: Mapped[str] = mapped_column(String(20), default="Unread")
    confidence: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )


def init_db():
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
        environmental_findings=agent_result["environmental_analysis"]["findings"],
    )

    with SessionLocal() as session:
        session.add(row)
        session.commit()


def save_notifications(user_id, image_id, alerts):
    if not alerts:
        return

    with SessionLocal() as session:
        for alert in alerts:
            confidence = float(alert.get("confidence", 0) or 0)

            session.add(Notification(
                user_id=user_id,
                image_id=image_id,
                title="Possible PPE Concern",
                message=str(alert.get("message", "Safety review required")),
                severity="High" if confidence >= 0.70 else "Medium",
                status="Unread",
                confidence=confidence,
            ))

        session.commit()


def list_notifications(user_id):
    with SessionLocal() as session:
        rows = (
            session.query(Notification)
            .filter(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .all()
        )

        return [
            {
                "id": row.id,
                "image_id": row.image_id,
                "title": row.title,
                "message": row.message,
                "severity": row.severity,
                "status": row.status,
                "confidence": row.confidence,
                "created_at": row.created_at.isoformat(),
            }
            for row in rows
        ]


def update_notification_status(user_id, notification_id, status):
    with SessionLocal() as session:
        row = session.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        ).first()

        if row is None:
            return False

        row.status = status
        session.commit()
        return True


def _to_dict(row):
    return {
        "image_id": row.image_id,
        "created_at": row.created_at.isoformat(),
        "rainfall_mm": row.rainfall_mm,
        "wind_speed_kmh": row.wind_speed_kmh,
        "temperature_c": row.temperature_c,
        "detection_count": row.detection_count,
        "detection_score": row.detection_score,
        "combined_score": row.combined_score,
        "risk_level": row.risk_level,
        "compliance_status": row.compliance_status,
        "findings": row.findings,
        "environmental_findings": row.environmental_findings,
    }


def list_assessments(limit=50):
    with SessionLocal() as session:
        rows = (
            session.query(Assessment)
            .order_by(Assessment.created_at.desc())
            .limit(limit)
            .all()
        )
        return [_to_dict(row) for row in rows]


from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()


def get_user_by_email(email: str):
    with SessionLocal() as session:
        return session.query(User).filter(
            User.email == email.lower().strip()
        ).first()


def create_user(name: str, email: str, password: str, role: str = "user"):
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
        admin = session.query(User).filter(User.email == "admin").first()

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
