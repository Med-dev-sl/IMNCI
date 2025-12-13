#!/usr/bin/env python3
"""
Create or update a Django superuser non-interactively.

Usage examples:
  python scripts/create_superuser.py --username IMNCI000 --password 'P@$$W0RD'
  DJANGO_SETTINGS_MODULE=imnci_project.settings python scripts/create_superuser.py --username admin --email admin@example.com --password secret

The script sets `DJANGO_SETTINGS_MODULE` to `imnci_project.settings` by default
and ensures the project root is on `sys.path` so it can import Django settings.
"""
import os
import sys
import argparse


def main():
    parser = argparse.ArgumentParser(description="Create or update a Django superuser.")
    parser.add_argument('--username', required=True, help='Username for the superuser')
    parser.add_argument('--email', default='', help='Email address')
    parser.add_argument('--password', required=True, help='Password for the superuser')
    parser.add_argument('--staff', action='store_true', help='Mark user as staff (default: True)')
    parser.add_argument('--superuser', action='store_true', help='Mark user as superuser (default: True)')
    parser.add_argument('--settings', default='imnci_project.settings', help='Django settings module')
    args = parser.parse_args()

    # Ensure project root is on sys.path (script lives in scripts/)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, '..'))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', args.settings)

    try:
        import django
        django.setup()
    except Exception as exc:
        print('Failed to setup Django:', exc)
        sys.exit(2)

    from django.contrib.auth import get_user_model

    User = get_user_model()
    username = args.username

    try:
        user, created = User.objects.get_or_create(username=username, defaults={'email': args.email or ''})
        user.email = args.email or user.email
        user.set_password(args.password)
        user.is_staff = True
        user.is_superuser = True
        user.save()
        if created:
            print(f'Created superuser: {username}')
        else:
            print(f'Updated superuser: {username}')
    except Exception as exc:
        print('Error creating/updating user:', exc)
        sys.exit(1)


if __name__ == '__main__':
    main()
