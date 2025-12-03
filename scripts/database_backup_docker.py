#!/usr/bin/env python3
"""
Database Backup Script (Docker Version)
Creates PostgreSQL database backups every 3 days and deletes old backups.
This version works with Docker containers.
"""

import os
import sys
import json
import subprocess
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, List

# Configuration
BACKUP_DIR = os.getenv("BACKUP_DIR", "./backups")
METADATA_FILE = os.path.join(BACKUP_DIR, "backup_metadata.json")
BACKUP_INTERVAL_DAYS = 3

# Docker configuration
DOCKER_CONTAINER = os.getenv("DOCKER_CONTAINER", "postgres")
USE_DOCKER = os.getenv("USE_DOCKER", "false").lower() == "true"

# Database configuration
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "postgres"),
    "databases": os.getenv("DB_NAMES", "fayo,user_service,hospital_service,doctor_service,specialty_service,appointment_service,payment_service").split(",")
}

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(BACKUP_DIR, "backup.log")),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


def ensure_backup_directory():
    """Create backup directory if it doesn't exist."""
    Path(BACKUP_DIR).mkdir(parents=True, exist_ok=True)
    logger.info(f"Backup directory: {BACKUP_DIR}")


def load_metadata() -> dict:
    """Load backup metadata from file."""
    if os.path.exists(METADATA_FILE):
        try:
            with open(METADATA_FILE, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            logger.warning("Metadata file corrupted, creating new one")
            return {}
    return {}


def save_metadata(metadata: dict):
    """Save backup metadata to file."""
    try:
        with open(METADATA_FILE, 'w') as f:
            json.dump(metadata, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to save metadata: {e}")


def get_last_backup_date(db_name: str, metadata: dict) -> Optional[datetime]:
    """Get the last backup date for a database."""
    if db_name in metadata and "last_backup" in metadata[db_name]:
        try:
            return datetime.fromisoformat(metadata[db_name]["last_backup"])
        except (ValueError, KeyError):
            return None
    return None


def should_backup(db_name: str, metadata: dict) -> bool:
    """Check if a backup should be created (3 days have passed)."""
    last_backup = get_last_backup_date(db_name, metadata)
    
    if last_backup is None:
        logger.info(f"No previous backup found for {db_name}, backup needed")
        return True
    
    days_since_backup = (datetime.now() - last_backup).days
    logger.info(f"Days since last backup for {db_name}: {days_since_backup}")
    
    return days_since_backup >= BACKUP_INTERVAL_DAYS


def get_old_backup_file(db_name: str, metadata: dict) -> Optional[str]:
    """Get the path to the old backup file that should be deleted."""
    if db_name in metadata and "last_backup_file" in metadata[db_name]:
        old_file = metadata[db_name]["last_backup_file"]
        if os.path.exists(old_file):
            return old_file
    return None


def create_backup_docker(db_name: str) -> Optional[str]:
    """Create a PostgreSQL database backup using pg_dump inside Docker container."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"{db_name}_backup_{timestamp}.sql"
    backup_path = os.path.join(BACKUP_DIR, backup_filename)
    
    # Build docker exec command for pg_dump
    # The backup will be created inside the container, then copied out
    container_backup_path = f"/tmp/{backup_filename}"
    
    # Set PGPASSWORD environment variable
    env = os.environ.copy()
    env["PGPASSWORD"] = DB_CONFIG["password"]
    
    # First, create backup inside container
    cmd = [
        "docker", "exec",
        "-e", f"PGPASSWORD={DB_CONFIG['password']}",
        DOCKER_CONTAINER,
        "pg_dump",
        "-h", "localhost",  # Inside container, use localhost
        "-U", DB_CONFIG["user"],
        "-d", db_name,
        "-F", "c",  # Custom format (compressed)
        "-f", container_backup_path
    ]
    
    try:
        logger.info(f"Creating backup for database: {db_name} (using Docker)")
        logger.debug(f"Running command: docker exec {DOCKER_CONTAINER} pg_dump ...")
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True
        )
        
        # Copy backup file from container to host
        copy_cmd = [
            "docker", "cp",
            f"{DOCKER_CONTAINER}:{container_backup_path}",
            backup_path
        ]
        
        result = subprocess.run(
            copy_cmd,
            capture_output=True,
            text=True,
            check=True
        )
        
        # Remove backup from container
        cleanup_cmd = [
            "docker", "exec",
            DOCKER_CONTAINER,
            "rm", container_backup_path
        ]
        subprocess.run(cleanup_cmd, capture_output=True, text=True)
        
        if os.path.exists(backup_path):
            file_size = os.path.getsize(backup_path)
            logger.info(f"Backup created successfully: {backup_filename} ({file_size / 1024 / 1024:.2f} MB)")
            return backup_path
        else:
            logger.error(f"Backup file was not created: {backup_path}")
            return None
            
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to create backup for {db_name}: {e.stderr}")
        return None
    except FileNotFoundError:
        logger.error("docker command not found. Please install Docker.")
        return None
    except Exception as e:
        logger.error(f"Unexpected error creating backup for {db_name}: {e}")
        return None


def create_backup_local(db_name: str) -> Optional[str]:
    """Create a PostgreSQL database backup using pg_dump (local connection)."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"{db_name}_backup_{timestamp}.sql"
    backup_path = os.path.join(BACKUP_DIR, backup_filename)
    
    # Set PGPASSWORD environment variable for pg_dump
    env = os.environ.copy()
    env["PGPASSWORD"] = DB_CONFIG["password"]
    
    # Build pg_dump command
    cmd = [
        "pg_dump",
        "-h", DB_CONFIG["host"],
        "-p", DB_CONFIG["port"],
        "-U", DB_CONFIG["user"],
        "-d", db_name,
        "-F", "c",  # Custom format (compressed)
        "-f", backup_path
    ]
    
    try:
        logger.info(f"Creating backup for database: {db_name}")
        logger.debug(f"Running command: {' '.join(cmd[:6])} ... -f {backup_path}")
        
        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True,
            check=True
        )
        
        if os.path.exists(backup_path):
            file_size = os.path.getsize(backup_path)
            logger.info(f"Backup created successfully: {backup_filename} ({file_size / 1024 / 1024:.2f} MB)")
            return backup_path
        else:
            logger.error(f"Backup file was not created: {backup_path}")
            return None
            
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to create backup for {db_name}: {e.stderr}")
        return None
    except FileNotFoundError:
        logger.error("pg_dump not found. Please install PostgreSQL client tools.")
        return None
    except Exception as e:
        logger.error(f"Unexpected error creating backup for {db_name}: {e}")
        return None


def delete_old_backup(backup_file: str):
    """Delete the old backup file."""
    try:
        if os.path.exists(backup_file):
            os.remove(backup_file)
            logger.info(f"Deleted old backup: {os.path.basename(backup_file)}")
        else:
            logger.warning(f"Old backup file not found: {backup_file}")
    except Exception as e:
        logger.error(f"Failed to delete old backup {backup_file}: {e}")


def backup_database(db_name: str, metadata: dict):
    """Backup a single database and update metadata."""
    if not should_backup(db_name, metadata):
        logger.info(f"Skipping backup for {db_name} - not yet time for backup")
        return
    
    # Get old backup file before creating new one
    old_backup_file = get_old_backup_file(db_name, metadata)
    
    # Create new backup (choose method based on USE_DOCKER)
    if USE_DOCKER:
        new_backup_file = create_backup_docker(db_name)
    else:
        new_backup_file = create_backup_local(db_name)
    
    if new_backup_file:
        # Update metadata
        if db_name not in metadata:
            metadata[db_name] = {}
        
        metadata[db_name]["last_backup"] = datetime.now().isoformat()
        metadata[db_name]["last_backup_file"] = new_backup_file
        save_metadata(metadata)
        
        # Delete old backup after successful new backup
        if old_backup_file:
            delete_old_backup(old_backup_file)
            # Update metadata to remove reference to deleted file
            if "previous_backup_file" in metadata[db_name]:
                del metadata[db_name]["previous_backup_file"]
    else:
        logger.error(f"Failed to create backup for {db_name}, keeping old backup if exists")


def main():
    """Main function to backup all databases."""
    logger.info("=" * 60)
    logger.info("Starting database backup process")
    if USE_DOCKER:
        logger.info(f"Using Docker container: {DOCKER_CONTAINER}")
    logger.info("=" * 60)
    
    ensure_backup_directory()
    metadata = load_metadata()
    
    # Backup each database
    for db_name in DB_CONFIG["databases"]:
        db_name = db_name.strip()
        if not db_name:
            continue
        
        logger.info(f"\nProcessing database: {db_name}")
        backup_database(db_name, metadata)
    
    logger.info("\n" + "=" * 60)
    logger.info("Backup process completed")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()

