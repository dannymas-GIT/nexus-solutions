"""add organizations and memberships

Revision ID: a1b2c3d4e5f6
Revises: 71c0d11ecede
Create Date: 2026-03-08 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '71c0d11ecede'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create organizations table
    op.create_table('organizations',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Create orgrole enum and organization_memberships table
    orgrole = sa.Enum('owner', 'admin', 'member', name='orgrole')
    orgrole.create(op.get_bind(), checkfirst=True)
    op.create_table('organization_memberships',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role', orgrole, nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_organization_memberships_organization_id'), 'organization_memberships', ['organization_id'], unique=False)
    op.create_index(op.f('ix_organization_memberships_user_id'), 'organization_memberships', ['user_id'], unique=False)

    # Add organization_id to workspaces (nullable)
    op.add_column('workspaces', sa.Column('organization_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_workspaces_organization_id'), 'workspaces', ['organization_id'], unique=False)

    # Data migration: for each workspace, create org, add membership, set organization_id
    conn = op.get_bind()
    workspaces = conn.execute(sa.text("SELECT id, name, owner_id, created_at, updated_at FROM workspaces")).fetchall()
    for ws in workspaces:
        ws_id, ws_name, owner_id, created_at, updated_at = ws
        conn.execute(
            sa.text("INSERT INTO organizations (name, created_at, updated_at) VALUES (:name, :created_at, :updated_at)"),
            {"name": ws_name or "Default Workspace", "created_at": created_at, "updated_at": updated_at}
        )
        r = conn.execute(sa.text("SELECT id FROM organizations ORDER BY id DESC LIMIT 1")).fetchone()
        org_id = r[0] if r else None
        if org_id is None:
            raise RuntimeError("Failed to get organization id after insert")
        conn.execute(
            sa.text("INSERT INTO organization_memberships (organization_id, user_id, role, created_at, updated_at) VALUES (:org_id, :user_id, 'owner', :created_at, :updated_at)"),
            {"org_id": org_id, "user_id": owner_id, "created_at": created_at, "updated_at": updated_at}
        )
        conn.execute(sa.text("UPDATE workspaces SET organization_id = :org_id WHERE id = :ws_id"), {"org_id": org_id, "ws_id": ws_id})

    # Drop owner_id, make organization_id NOT NULL
    # Use batch for SQLite - drop_column removes the FK automatically
    with op.batch_alter_table('workspaces', schema=None) as batch_op:
        batch_op.drop_index('ix_workspaces_workspace_type')
        batch_op.drop_column('owner_id')  # FK drops with column
        batch_op.alter_column('organization_id', nullable=False)
        batch_op.create_foreign_key('workspaces_organization_id_fkey', 'organizations', ['organization_id'], ['id'])
        batch_op.create_index('ix_workspaces_workspace_type', ['workspace_type'], unique=False)

    # Create intakes table
    op.create_table('intakes',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('workspace_id', sa.Integer(), nullable=True),
        sa.Column('business_name', sa.String(length=255), nullable=True),
        sa.Column('industry', sa.String(length=255), nullable=True),
        sa.Column('data_json', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_intakes_workspace_id'), 'intakes', ['workspace_id'], unique=False)

    # Create connectors table
    op.create_table('connectors',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('workspace_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('connector_type', sa.String(length=64), nullable=False),
        sa.Column('config_json', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('last_sync_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_connectors_workspace_id'), 'connectors', ['workspace_id'], unique=False)

    # Create kpis table
    op.create_table('kpis',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('workspace_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('metric_key', sa.String(length=128), nullable=False),
        sa.Column('target_value', sa.Float(), nullable=True),
        sa.Column('unit', sa.String(length=32), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_kpis_workspace_id'), 'kpis', ['workspace_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_kpis_workspace_id'), table_name='kpis')
    op.drop_table('kpis')
    op.drop_index(op.f('ix_connectors_workspace_id'), table_name='connectors')
    op.drop_table('connectors')
    op.drop_index(op.f('ix_intakes_workspace_id'), table_name='intakes')
    op.drop_table('intakes')

    # Restore owner_id from organization memberships (owner role)
    conn = op.get_bind()
    rows = conn.execute(sa.text(
        "SELECT w.id, m.user_id FROM workspaces w "
        "JOIN organization_memberships m ON w.organization_id = m.organization_id AND m.role = 'owner'"
    )).fetchall()
    with op.batch_alter_table('workspaces', schema=None) as batch_op:
        batch_op.drop_constraint('workspaces_organization_id_fkey', type_='foreignkey')
        batch_op.add_column(sa.Column('owner_id', sa.Integer(), nullable=True))
    for ws_id, owner_id in rows:
        conn.execute(sa.text("UPDATE workspaces SET owner_id = :owner_id WHERE id = :ws_id"), {"owner_id": owner_id, "ws_id": ws_id})
    with op.batch_alter_table('workspaces', schema=None) as batch_op:
        batch_op.alter_column('owner_id', nullable=False)
        batch_op.create_foreign_key('workspaces_owner_id_fkey', 'users', ['owner_id'], ['id'])
        batch_op.drop_index('ix_workspaces_organization_id')
        batch_op.drop_column('organization_id')

    op.drop_index(op.f('ix_organization_memberships_user_id'), table_name='organization_memberships')
    op.drop_index(op.f('ix_organization_memberships_organization_id'), table_name='organization_memberships')
    op.drop_table('organization_memberships')
    sa.Enum(name='orgrole').drop(op.get_bind(), checkfirst=True)
    op.drop_table('organizations')
