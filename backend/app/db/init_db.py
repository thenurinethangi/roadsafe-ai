"""
Creates the tables. Run once:  python -m app.db.init_db
"""

from app.db.session import Base, engine
from app.db import models          


def main():
    Base.metadata.create_all(bind=engine)
    print("Tables created:", list(Base.metadata.tables.keys()))


if __name__ == "__main__":
    main()
