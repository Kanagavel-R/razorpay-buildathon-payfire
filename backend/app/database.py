from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Normalize DATABASE_URL (Render provides postgres:// which SQLAlchemy 2.0 requires as postgresql://)
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI Dependency for database session management."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all database tables."""
    from app.models.incident import IncidentModel  # noqa: F401
    from app.models.simulation import SimulationModel, SimulationResultModel  # noqa: F401
    from app.models.strategy import StrategyModel  # noqa: F401
    from app.models.audit import AuditLogModel  # noqa: F401
    from app.models.chaos_scenario import ChaosScenarioModel  # noqa: F401
    Base.metadata.create_all(bind=engine)


# Auto-create tables on module load for seamless SQLite usage
init_db()
