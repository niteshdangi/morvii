# Generated by Django 2.2.13 on 2020-09-17 09:13

from django.conf import settings
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('mopic', '0004_mopiccommentreply_commentmain'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='MopicLikes',
            new_name='MopicLike',
        ),
    ]
