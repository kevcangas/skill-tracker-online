"""Increase string sizes and convert text fields to Text in PostgreSQL

Revision ID: 003_increase_string_sizes
Revises: 002_add_is_archived_and_milestone_fields
Create Date: 2026-09-22 16:38:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003_increase_string_sizes'
down_revision: Union[str, None] = '002_add_is_archived_and_milestone_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Skills table: expand name, description to Text, current_level
    op.alter_column('skills', 'name',
                    type_=sa.String(length=255),
                    existing_type=sa.String(length=150),
                    existing_nullable=False)
    op.alter_column('skills', 'description',
                    type_=sa.Text(),
                    existing_type=sa.String(length=500),
                    existing_nullable=True)
    op.alter_column('skills', 'current_level',
                    type_=sa.String(length=100),
                    existing_type=sa.String(length=50),
                    existing_nullable=True)

    # 2. Progress Logs table: expand notes to Text (unlimited notes)
    op.alter_column('progress_logs', 'notes',
                    type_=sa.Text(),
                    existing_type=sa.String(length=1000),
                    existing_nullable=True)

    # 3. Milestones table: expand title to Text, type and priority
    op.alter_column('milestones', 'title',
                    type_=sa.Text(),
                    existing_type=sa.String(length=200),
                    existing_nullable=False)
    op.alter_column('milestones', 'type',
                    type_=sa.String(length=100),
                    existing_type=sa.String(length=50),
                    existing_nullable=False)
    op.alter_column('milestones', 'priority',
                    type_=sa.String(length=50),
                    existing_type=sa.String(length=20),
                    existing_nullable=True)

    # 4. Categories table: expand name, color, icon
    op.alter_column('categories', 'name',
                    type_=sa.String(length=255),
                    existing_type=sa.String(length=100),
                    existing_nullable=False)
    op.alter_column('categories', 'color',
                    type_=sa.String(length=50),
                    existing_type=sa.String(length=30),
                    existing_nullable=True)
    op.alter_column('categories', 'icon',
                    type_=sa.String(length=100),
                    existing_type=sa.String(length=50),
                    existing_nullable=True)

    # 5. Users table: expand hashed_password, full_name
    op.alter_column('users', 'hashed_password',
                    type_=sa.String(length=500),
                    existing_type=sa.String(length=255),
                    existing_nullable=False)
    op.alter_column('users', 'full_name',
                    type_=sa.String(length=500),
                    existing_type=sa.String(length=255),
                    existing_nullable=True)


def downgrade() -> None:
    # 5. Users table
    op.alter_column('users', 'full_name',
                    type_=sa.String(length=255),
                    existing_type=sa.String(length=500),
                    existing_nullable=True)
    op.alter_column('users', 'hashed_password',
                    type_=sa.String(length=255),
                    existing_type=sa.String(length=500),
                    existing_nullable=False)

    # 4. Categories table
    op.alter_column('categories', 'icon',
                    type_=sa.String(length=50),
                    existing_type=sa.String(length=100),
                    existing_nullable=True)
    op.alter_column('categories', 'color',
                    type_=sa.String(length=30),
                    existing_type=sa.String(length=50),
                    existing_nullable=True)
    op.alter_column('categories', 'name',
                    type_=sa.String(length=100),
                    existing_type=sa.String(length=255),
                    existing_nullable=False)

    # 3. Milestones table
    op.alter_column('milestones', 'priority',
                    type_=sa.String(length=20),
                    existing_type=sa.String(length=50),
                    existing_nullable=True)
    op.alter_column('milestones', 'type',
                    type_=sa.String(length=50),
                    existing_type=sa.String(length=100),
                    existing_nullable=False)
    op.alter_column('milestones', 'title',
                    type_=sa.String(length=200),
                    existing_type=sa.Text(),
                    existing_nullable=False)

    # 2. Progress Logs table
    op.alter_column('progress_logs', 'notes',
                    type_=sa.String(length=1000),
                    existing_type=sa.Text(),
                    existing_nullable=True)

    # 1. Skills table
    op.alter_column('skills', 'current_level',
                    type_=sa.String(length=50),
                    existing_type=sa.String(length=100),
                    existing_nullable=True)
    op.alter_column('skills', 'description',
                    type_=sa.String(length=500),
                    existing_type=sa.Text(),
                    existing_nullable=True)
    op.alter_column('skills', 'name',
                    type_=sa.String(length=150),
                    existing_type=sa.String(length=255),
                    existing_nullable=False)
