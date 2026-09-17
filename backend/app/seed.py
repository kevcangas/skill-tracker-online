import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.category import SkillCategory
from app.models.skill import Skill
from app.models.log import ProgressLog
from app.models.milestone import Milestone

def seed():
    db: Session = SessionLocal()
    try:
        # Check or create default user
        user = db.query(User).filter(User.email == "demo@example.com").first()
        if not user:
            user = User(
                id=str(uuid.uuid4()),
                email="demo@example.com",
                hashed_password=get_password_hash("password123"),
                full_name="Demo Homelab User"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created demo user: demo@example.com")

        user_id = user.id

        # Check existing categories
        cat_count = db.query(SkillCategory).filter(SkillCategory.user_id == user_id).count()
        if cat_count == 0:
            print("Seeding initial categories, skills, and progress logs...")

            # Categories requested: Tecnología, Idiomas, Arte, Música, Deportes y Salud, General
            c1 = SkillCategory(id=str(uuid.uuid4()), user_id=user_id, name="Tecnología", color="#3B82F6", icon="code")
            c2 = SkillCategory(id=str(uuid.uuid4()), user_id=user_id, name="Idiomas", color="#10B981", icon="globe")
            c3 = SkillCategory(id=str(uuid.uuid4()), user_id=user_id, name="Arte", color="#EC4899", icon="palette")
            c4 = SkillCategory(id=str(uuid.uuid4()), user_id=user_id, name="Música", color="#8B5CF6", icon="music")
            c5 = SkillCategory(id=str(uuid.uuid4()), user_id=user_id, name="Deportes y Salud", color="#F59E0B", icon="activity")
            c6 = SkillCategory(id=str(uuid.uuid4()), user_id=user_id, name="General", color="#6B7280", icon="folder")
            db.add_all([c1, c2, c3, c4, c5, c6])
            db.commit()

            # Skills
            s1 = Skill(id=str(uuid.uuid4()), user_id=user_id, category_id=c1.id, name="Python & FastAPI Backend")
            s2 = Skill(id=str(uuid.uuid4()), user_id=user_id, category_id=c1.id, name="Docker & Kubernetes Operations")
            s3 = Skill(id=str(uuid.uuid4()), user_id=user_id, category_id=c2.id, name="Alemán (Nivel B1)")
            s4 = Skill(id=str(uuid.uuid4()), user_id=user_id, category_id=c5.id, name="Calistenia & Ejercicio")
            s5 = Skill(id=str(uuid.uuid4()), user_id=user_id, category_id=c4.id, name="Guitarra Acústica")
            db.add_all([s1, s2, s3, s4, s5])
            db.commit()

            # Milestones
            m1 = Milestone(id=str(uuid.uuid4()), user_id=user_id, skill_id=s1.id, title="Build first async FastAPI sync engine")
            m2 = Milestone(id=str(uuid.uuid4()), user_id=user_id, skill_id=s3.id, title="Complete A2 German Vocabulary deck")
            db.add_all([m1, m2])

            # Sample Logs over last 30 days
            now = datetime.now(timezone.utc)
            skills = [s1, s2, s3, s4, s5]
            logs = []
            for day in range(30):
                log_day = now - timedelta(days=day)
                if day % 2 == 0:
                    sk = skills[day % len(skills)]
                    dur = 30 + (day * 7) % 90
                    logs.append(
                        ProgressLog(
                            id=str(uuid.uuid4()),
                            user_id=user_id,
                            skill_id=sk.id,
                            duration_minutes=dur,
                            notes=f"Practice session day -{day}: focused on core exercises.",
                            logged_at=log_day,
                            updated_at=log_day
                        )
                    )
            db.add_all(logs)
            db.commit()
            print("Successfully seeded initial Spanish categories, skills and logs!")
        else:
            print("Database already contains data, skipping seed.")

    finally:
        db.close()

if __name__ == "__main__":
    seed()
