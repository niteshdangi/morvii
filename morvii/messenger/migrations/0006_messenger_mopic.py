# Generated by Django 2.2.13 on 2020-10-05 09:15

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('mopic', '0005_auto_20200917_1443'),
        ('messenger', '0005_messenger_story'),
    ]

    operations = [
        migrations.AddField(
            model_name='messenger',
            name='mopic',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='mopic.Mopic'),
        ),
    ]
