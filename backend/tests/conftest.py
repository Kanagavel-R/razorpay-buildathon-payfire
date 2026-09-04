import pytest
from app.database import init_db


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Ensures all database tables are created before running tests."""
    init_db()
