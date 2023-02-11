from django.contrib import admin
from mopic.models import Mopic, MopicMedia
# Register your models here.


class MopicAdmin(admin.ModelAdmin):
    pass


admin.site.register(Mopic, MopicAdmin)
admin.site.register(MopicMedia, MopicAdmin)
