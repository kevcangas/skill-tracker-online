"""Add is_archived to skills and priority, is_completed, due_date to milestones

Revision ID: 002_add_is_archived_and_milestone_fields
Revises: 001_initial_schema
Create Date: 2026-09-22 13:40:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002_add_is_archived_and_milestone_fields'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add is_archived column to skills table
    op.add_column(
        'skills',
        sa.Column('is_archived', sa.Boolean(), server_default=sa.text('false'), nullable=False)
    )

    # 2. Add priority, is_completed, and due_date to milestones table
    op.add_column(
        'milestones',
        sa.Column('priority', sa.String(length=20), server_default='Media', nullable=True)
    )
    op.add_column(
        'milestones',
        sa.Column('is_completed', sa.Boolean(), server_default=sa.text('false'), nullable=False)
    )
    op.add_column(
        'milestones',
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('milestones', 'due_date')
    op.drop_column('milestones', 'is_completed')
    op.drop_column('milestones', 'priority')
    op.drop_column('skills', 'is_archived')
