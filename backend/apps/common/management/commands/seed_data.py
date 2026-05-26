"""
Management command: seed_data
Usage: python manage.py seed_data

Creates sample users and a sample quiz for testing.
Run this AFTER running migrations.
"""

from django.core.management.base import BaseCommand
from apps.users.models import User
from apps.quizzes.models import Quiz, Question


class Command(BaseCommand):
    help = 'Seed the database with sample data for testing'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # Create test users
        users_data = [
            {
                'username': 'alice',
                'email': 'alice@example.com',
                'first_name': 'Alice',
                'last_name': 'Smith',
                'total_points': 450,
                'streak_days': 5,
            },
            {
                'username': 'bob',
                'email': 'bob@example.com',
                'first_name': 'Bob',
                'last_name': 'Jones',
                'total_points': 320,
                'streak_days': 3,
            },
            {
                'username': 'charlie',
                'email': 'charlie@example.com',
                'first_name': 'Charlie',
                'last_name': 'Brown',
                'total_points': 180,
                'streak_days': 1,
            },
        ]

        created_users = []
        for ud in users_data:
            user, created = User.objects.get_or_create(
                email=ud['email'],
                defaults={**ud}
            )
            if created:
                user.set_password('TestPassword123!')
                user.save()
                self.stdout.write(f'  Created user: {user.email}')
            else:
                self.stdout.write(f'  User already exists: {user.email}')
            created_users.append(user)

        # Create a sample quiz for the first user
        alice = created_users[0]

        quiz, created = Quiz.objects.get_or_create(
            title='Sample Python Quiz',
            created_by=alice,
            defaults={
                'topic': 'Python Programming Basics',
                'difficulty': 'easy',
                'total_questions': 3,
                'time_limit_minutes': 5,
            }
        )

        if created:
            self.stdout.write('  Created sample quiz: Python Quiz')

            questions_data = [
                {
                    'question_text': 'What does Python use for indentation?',
                    'option_a': 'Curly braces {}',
                    'option_b': 'Spaces or tabs',
                    'option_c': 'Semicolons',
                    'option_d': 'Square brackets []',
                    'correct_answer': 'B',
                    'explanation': 'Python uses indentation (spaces or tabs) to define code blocks.',
                    'order': 1,
                },
                {
                    'question_text': 'Which keyword is used to define a function in Python?',
                    'option_a': 'function',
                    'option_b': 'fun',
                    'option_c': 'def',
                    'option_d': 'define',
                    'correct_answer': 'C',
                    'explanation': 'In Python, functions are defined using the "def" keyword.',
                    'order': 2,
                },
                {
                    'question_text': 'What is the output of: print(type([]))?',
                    'option_a': "<class 'array'>",
                    'option_b': "<class 'list'>",
                    'option_c': "<class 'tuple'>",
                    'option_d': "<class 'dict'>",
                    'correct_answer': 'B',
                    'explanation': '[] creates an empty list in Python.',
                    'order': 3,
                },
            ]

            for qd in questions_data:
                Question.objects.create(quiz=quiz, **qd)

            self.stdout.write('  Created 3 sample questions')

        self.stdout.write(self.style.SUCCESS('\n✅ Database seeded successfully!'))
        self.stdout.write('\nTest accounts (password: TestPassword123!):')
        for ud in users_data:
            self.stdout.write(f"  - {ud['email']}")
        self.stdout.write(f'\nSample quiz ID: {quiz.id}')
