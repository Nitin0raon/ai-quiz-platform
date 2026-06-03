from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Create a superuser if none exists'

    def handle(self, *args, **options):
        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write('Superuser already exists. Skipping.')
            return

        import os
        email    = os.getenv('DJANGO_SUPERUSER_EMAIL',    'admin@quizai.com')
        username = os.getenv('DJANGO_SUPERUSER_USERNAME', 'admin')
        password = os.getenv('DJANGO_SUPERUSER_PASSWORD', 'Admin@123456')

        User.objects.create_superuser(
            email=email,
            username=username,
            password=password,
        )
        self.stdout.write(
            self.style.SUCCESS(f'Superuser created: {email}')
        )