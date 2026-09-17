"""Initial schema creation for Skill Tracker

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-16 14:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Users Table
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # Categories Table
    op.create_table(
        'categories',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('color', sa.String(length=30), nullable=True),
        sa.Column('icon', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('sync_status', sa.String(length=20), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_categories_user_id'), 'categories', ['user_id'], unique=False)
    op.create_index(op.f('ix_categories_updated_at'), 'categories', ['updated_at'], unique=False)
    op.create_index(op.f('ix_categories_is_deleted'), 'categories', ['is_deleted'], unique=False)

    # Skills Table
    op.create_table(
        'skills',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('category_id', sa.String(length=36), nullable=True),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('target_hours', sa.Float(), nullable=True),
        sa.Column('current_level', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('sync_status', sa.String(length=20), nullable=False),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_skills_user_id'), 'skills', ['user_id'], unique=False)
    op.create_index(op.f('ix_skills_category_id'), 'skills', ['category_id'], unique=False)
    op.create_index(op.f('ix_skills_updated_at'), 'skills', ['updated_at'], unique=False)

    # Progress Logs Table
    op.create_table(
        'progress_logs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('skill_id', sa.String(length=36), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=False),
        sa.Column('notes', sa.String(length=1000), nullable=True),
        sa.Column('logged_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('sync_status', sa.String(length=20), nullable=False),
        sa.ForeignKeyConstraint(['skill_id'], ['skills.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_progress_logs_user_id'), 'progress_logs', ['user_id'], unique=False)
    op.create_index(op.f('ix_progress_logs_skill_id'), 'progress_logs', ['skill_id'], unique=False)
    op.create_index(op.f('ix_progress_logs_updated_at'), 'progress_logs', ['updated_at'], unique=False)

    # Milestones Table
    op.create_table(
        'milestones',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('skill_id', sa.String(length=36), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False, server_default='milestone'),
        sa.Column('achieved_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('sync_status', sa.String(length=20), nullable=False),
        sa.ForeignKeyConstraint(['skill_id'], ['skills.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_milestones_user_id'), 'milestones', ['user_id'], unique=False)
    op.create_index(op.f('ix_milestones_skill_id'), 'milestones', ['skill_id'], unique=False)

def downgrade() -> None:
    op.drop_table('milestones')
    op.drop_table('progress_logs')
    op.drop_table('skills')
    op.drop_table('categories')
    op.drop_table('users')
