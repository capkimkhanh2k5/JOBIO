from django.apps import AppConfig


class InterviewsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.recruitment.interviews'
    label = 'recruitment_interviews'

    def ready(self):
        import apps.recruitment.interviews.signals

