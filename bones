#!/bin/bash

set -eo pipefail

# Only files from this directory may be backed up.
# BONES_SOURCE_DIR="/home/tomboyo"
#
# This directory holds baked-up files, and nothing else.
# BONES_RSYNC_DIR="/home/tomboyo.rsync"
#
# The (external) location where backups are saved.
# BONES_BACKUP_DIR="/run/media/tomboyo/Bones/backups/rsync"

function validate {
  if [ "$BONES_SOURCE_DIR" == "" ] ; then
    >&2 echo "BONES_SOURCE_DIR is missing."
    exit 1
  fi

  if [ ! -d $BONES_SOURCE_DIR ] ; then
    >&2 echo "BONES_SOURCE_DIR '$BONES_SOURCE_DIR' does not exist."
    exit 1
  fi

  if [ "$BONES_RSYNC_DIR" == "" ] ; then
    >&2 echo "BONES_RSYNC_DIR is missing."
    exit 1
  fi

  if [ ! -d $BONES_RSYNC_DIR ] ; then
    >&2 echo "BONES_RSYNC_DIR '$BONES_RSYNC_DIR' does not exist."
    exit 1
  fi

  if [ "$BONES_BACKUP_DIR" == "" ] ; then
    >&2 echo "BONES_BACKUP_DIR is missing."
    exit 1
  fi

  if [ ! -d $BONES_BACKUP_DIR ] ; then
    >&2 echo "BONES_BACKUP_DIR '$BONES_BACKUP_DIR' does not exist."
    >&2 echo "(Did you plug in your external drive?)"
    exit 1
  fi
}

function add_source {
  local source=$(realpath "${1:?usage: backups add <file>}")
  local base="$BONES_SOURCE_DIR/"

  if [[ $source != $base* ]] ; then
    >&2 echo "Cannot backup $source because it is not in $base."
    exit 1
  fi
  
  local dest="$BONES_RSYNC_DIR/${source#$base}"
  mkdir -p $(dirname $dest)
  mv $source $dest
  ln -s $dest $source
}

function sync {
  local from=$BONES_RSYNC_DIR
  local to=$BONES_BACKUP_DIR
  echo "WARNING"
  echo "Synchronization will delete files from the backup if they were "
  echo "removed since the last synchronization. If you incompletely"
  echo "recover your drive and then run synch, files may be peremenantly"
  echo "lost."
  echo
  read -p "Synchronizing $from with $to. Do you wish to proceed? [y/N]" -n 1 -r
  echo

  if [[ $REPLY =~ ^[Yy]$ ]] ; then
    rsync --archive --delete $from $to
  fi
}

function usage {
  echo "bones [command] [args...]"
  echo ""
  echo "COMMANDS"
  echo ""
  echo "  add <source>"
  echo "      Mark a file or directory to be synchronized when synch is called."
  echo "      The file is moved to the BONES_RSYNC_DIR and replaced with a"
  echo "      symlink to that file. Only files in BONES_SOURCE_DIR may be"
  echo "      added."
  echo ""
  echo "  sync"
  echo "  synch"
  echo "      Synchronize all added files with the BONES_BACKUP_DIR. This is a"
  echo "      destructive operation; it will delete all files which were removed"
  echo "      from BONES_SOURCE_DIR since the last sync. If you incompletely"
  echo "      recover your drive and then run sync, files may be permenantly"
  echo "      lost."
  echo ""
  echo "      This will create a new folder in the BONES_BACKUP_DIR with the"
  echo "      same name as BONES_RSYNC_DIR."
  echo ""
  echo "  help"
  echo "      Show this message."
  echo ""
}

validate 

case $1 in
  "add")
    add_source $2
    ;;
  "sync"|"synch")
    sync
    ;;
  "help")
    usage
    exit 0
    ;;
  *)
    echo "Unknown command '$1'"
    usage
    exit 1
    ;;
esac
