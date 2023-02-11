from messenger.models import ThemeData
from messenger.models import MessengerTheme
from django.contrib import admin

# Register your models here.


class MessengerThemeAdmin(admin.ModelAdmin):
    pass


admin.site.register(MessengerTheme, MessengerThemeAdmin)
admin.site.register(ThemeData, MessengerThemeAdmin)
