# This is an auto-generated Django model module.

# You'll have to do the following manually to clean this up:

#   * Rearrange models' order

#   * Make sure each model has one field with primary_key=True

#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior

#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table

# Feel free to rename the models, but don't rename db_table values or field names.

from django.db import models





class ActivityLogTypes(models.Model):

    id = models.BigAutoField(primary_key=True)

    type_name = models.CharField(unique=True, max_length=50)

    description = models.TextField(blank=True, null=True)

    severity = models.CharField(max_length=20)

    is_active = models.BooleanField()

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'activity_log_types'





class ActivityLogs(models.Model):

    id = models.BigAutoField(primary_key=True)

    action = models.CharField(max_length=100)

    entity_type = models.CharField(max_length=50, blank=True, null=True)

    entity_id = models.IntegerField(blank=True, null=True)

    ip_address = models.GenericIPAddressField(blank=True, null=True)

    user_agent = models.TextField(blank=True, null=True)

    details = models.JSONField(blank=True, null=True)

    created_at = models.DateTimeField()

    log_type = models.ForeignKey(ActivityLogTypes, models.DO_NOTHING)

    user = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'activity_logs'





class Addresses(models.Model):

    id = models.BigAutoField(primary_key=True)

    address_line = models.CharField(max_length=255)

    latitude = models.DecimalField(max_digits=10, decimal_places=8, blank=True, null=True)

    longitude = models.DecimalField(max_digits=11, decimal_places=8, blank=True, null=True)

    is_verified = models.BooleanField()

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    commune = models.ForeignKey('Communes', models.DO_NOTHING, blank=True, null=True)

    province = models.ForeignKey('Provinces', models.DO_NOTHING)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'addresses'





class AnalyticsGeneratedreport(models.Model):

    id = models.BigAutoField(primary_key=True)

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    name = models.CharField(max_length=255)

    report_type = models.CharField(max_length=50)

    file = models.CharField(max_length=500)

    filters = models.JSONField()

    created_by = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'analytics_generatedreport'





class AnalyticsReports(models.Model):

    id = models.BigAutoField(primary_key=True)

    report_period_start = models.DateField()

    report_period_end = models.DateField()

    metrics = models.JSONField()

    generated_at = models.DateTimeField()

    company = models.ForeignKey('Companies', models.DO_NOTHING, blank=True, null=True)

    generated_by = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)

    report_type = models.ForeignKey('ReportTypes', models.DO_NOTHING)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'analytics_reports'





class ApplicationStatusHistory(models.Model):

    id = models.BigAutoField(primary_key=True)

    old_status = models.CharField(max_length=50, blank=True, null=True)

    new_status = models.CharField(max_length=50)

    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField()

    application = models.ForeignKey('Applications', models.DO_NOTHING)

    changed_by = models.ForeignKey('Users', models.DO_NOTHING)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'application_status_history'





class Applications(models.Model):

    id = models.BigAutoField(primary_key=True)

    cover_letter = models.TextField(blank=True, null=True)

    status = models.CharField(max_length=20)

    rating = models.IntegerField(blank=True, null=True)

    notes = models.TextField(blank=True, null=True)

    applied_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    reviewed_at = models.DateTimeField(blank=True, null=True)

    cv = models.ForeignKey('RecruiterCvs', models.DO_NOTHING, blank=True, null=True)

    job = models.ForeignKey('Jobs', models.DO_NOTHING)

    recruiter = models.ForeignKey('Recruiters', models.DO_NOTHING)

    reviewed_by = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'applications'

        unique_together = (('job', 'recruiter'),)





class AuditLogs(models.Model):

    id = models.BigAutoField(primary_key=True)

    action = models.CharField(max_length=100)

    entity_type = models.CharField(max_length=50)

    entity_id = models.IntegerField(blank=True, null=True)

    old_values = models.JSONField(blank=True, null=True)

    new_values = models.JSONField(blank=True, null=True)

    ip_address = models.GenericIPAddressField(blank=True, null=True)

    user_agent = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField()

    user = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'audit_logs'





class AuthGroup(models.Model):

    name = models.CharField(unique=True, max_length=150)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'auth_group'





class AuthGroupPermissions(models.Model):

    id = models.BigAutoField(primary_key=True)

    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)

    permission = models.ForeignKey('AuthPermission', models.DO_NOTHING)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'auth_group_permissions'

        unique_together = (('group', 'permission'),)





class AuthPermission(models.Model):

    name = models.CharField(max_length=255)

    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING)

    codename = models.CharField(max_length=100)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'auth_permission'

        unique_together = (('content_type', 'codename'),)





class BenefitCategories(models.Model):

    id = models.BigAutoField(primary_key=True)

    name = models.CharField(max_length=100)

    slug = models.CharField(unique=True, max_length=100)

    icon_url = models.CharField(max_length=255, blank=True, null=True)

    is_active = models.BooleanField()

    display_order = models.IntegerField()

    created_at = models.DateTimeField()

    description = models.TextField(blank=True, null=True)

    updated_at = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'benefit_categories'





class BlogCategory(models.Model):

    id = models.BigAutoField(primary_key=True)

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    name = models.CharField(max_length=255)

    slug = models.CharField(unique=True, max_length=50)

    description = models.TextField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'blog_category'





class BlogPost(models.Model):

    id = models.BigAutoField(primary_key=True)

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    title = models.CharField(max_length=255)

    slug = models.CharField(unique=True, max_length=50)

    summary = models.TextField()

    content = models.TextField()

    thumbnail = models.CharField(max_length=100, blank=True, null=True)

    status = models.CharField(max_length=20)

    published_at = models.DateTimeField(blank=True, null=True)

    view_count = models.IntegerField()

    meta_title = models.CharField(max_length=255)

    meta_description = models.TextField()

    author = models.ForeignKey('Users', models.DO_NOTHING)

    category = models.ForeignKey(BlogCategory, models.DO_NOTHING, blank=True, null=True)

    company = models.ForeignKey('Companies', models.DO_NOTHING, blank=True, null=True)

    is_featured = models.BooleanField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'blog_post'





class BlogPostTags(models.Model):

    id = models.BigAutoField(primary_key=True)

    post = models.ForeignKey(BlogPost, models.DO_NOTHING)

    tag = models.ForeignKey('BlogTag', models.DO_NOTHING)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'blog_post_tags'

        unique_together = (('post', 'tag'),)





class BlogTag(models.Model):

    id = models.BigAutoField(primary_key=True)

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    name = models.CharField(max_length=100)

    slug = models.CharField(unique=True, max_length=50)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'blog_tag'





class Communes(models.Model):

    id = models.BigAutoField(primary_key=True)

    commune_name = models.CharField(max_length=100)

    commune_type = models.CharField(max_length=20)

    is_active = models.BooleanField()

    created_at = models.DateTimeField()

    province = models.ForeignKey('Provinces', models.DO_NOTHING)

    updated_at = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'communes'





class Companies(models.Model):

    id = models.BigAutoField(primary_key=True)

    company_name = models.CharField(max_length=255)

    slug = models.CharField(unique=True, max_length=255)

    tax_code = models.CharField(unique=True, max_length=50, blank=True, null=True)

    company_size = models.CharField(max_length=20, blank=True, null=True)

    website = models.CharField(max_length=255, blank=True, null=True)

    logo_url = models.CharField(max_length=500, blank=True, null=True)

    banner_url = models.CharField(max_length=500, blank=True, null=True)

    description = models.TextField(blank=True, null=True)

    founded_year = models.IntegerField(blank=True, null=True)

    verification_status = models.CharField(max_length=20)

    verified_at = models.DateTimeField(blank=True, null=True)

    follower_count = models.IntegerField()

    job_count = models.IntegerField()

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    address = models.ForeignKey(Addresses, models.DO_NOTHING, blank=True, null=True)

    industry = models.ForeignKey('Industries', models.DO_NOTHING, blank=True, null=True)

    user = models.OneToOneField('Users', models.DO_NOTHING, blank=True, null=True)

    verified_by = models.ForeignKey('Users', models.DO_NOTHING, related_name='companies_verified_by_set', blank=True, null=True)

    email = models.CharField(max_length=255, blank=True, null=True)

    phone = models.CharField(max_length=20, blank=True, null=True)

    headquarters = models.CharField(max_length=500, blank=True, null=True)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'companies'





class CompanyBenefits(models.Model):

    id = models.BigAutoField(primary_key=True)

    benefit_name = models.CharField(max_length=255)

    description = models.TextField(blank=True, null=True)

    display_order = models.IntegerField()

    created_at = models.DateTimeField()

    category = models.ForeignKey(BenefitCategories, models.DO_NOTHING)

    company = models.ForeignKey(Companies, models.DO_NOTHING)

    updated_at = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'company_benefits'





class CompanyFollowers(models.Model):

    id = models.BigAutoField(primary_key=True)

    created_at = models.DateTimeField()

    company = models.ForeignKey(Companies, models.DO_NOTHING)

    recruiter = models.ForeignKey('Recruiters', models.DO_NOTHING)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'company_followers'

        unique_together = (('company', 'recruiter'),)





class CompanyMedia(models.Model):

    id = models.BigAutoField(primary_key=True)

    media_url = models.CharField(max_length=500)

    thumbnail_url = models.CharField(max_length=500, blank=True, null=True)

    title = models.CharField(max_length=255, blank=True, null=True)

    caption = models.TextField(blank=True, null=True)

    display_order = models.IntegerField()

    created_at = models.DateTimeField()

    company = models.ForeignKey(Companies, models.DO_NOTHING)

    media_type = models.ForeignKey('MediaTypes', models.DO_NOTHING)

    updated_at = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'company_media'





class CompanySubscriptions(models.Model):

    id = models.BigAutoField(primary_key=True)

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    start_date = models.DateField()

    end_date = models.DateField()

    status = models.CharField(max_length=20)

    auto_renew = models.BooleanField()

    company = models.OneToOneField(Companies, models.DO_NOTHING)

    plan = models.ForeignKey('SubscriptionPlans', models.DO_NOTHING)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'company_subscriptions'





class CvTemplateCategories(models.Model):

    id = models.BigAutoField(primary_key=True)

    name = models.CharField(max_length=100)

    slug = models.CharField(unique=True, max_length=100)

    description = models.TextField(blank=True, null=True)

    is_active = models.BooleanField()

    created_at = models.DateTimeField()

    display_order = models.IntegerField()

    updated_at = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'cv_template_categories'





class CvTemplates(models.Model):

    id = models.BigAutoField(primary_key=True)

    name = models.CharField(max_length=100)

    thumbnail_url = models.CharField(max_length=500, blank=True, null=True)

    preview_url = models.CharField(max_length=500, blank=True, null=True)

    template_data = models.JSONField(blank=True, null=True)

    is_premium = models.BooleanField()

    price = models.DecimalField(max_digits=10, decimal_places=2)

    usage_count = models.IntegerField()

    rating = models.DecimalField(max_digits=3, decimal_places=2)

    is_active = models.BooleanField()

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    category = models.ForeignKey(CvTemplateCategories, models.DO_NOTHING)

    file_name = models.CharField(max_length=100, blank=True, null=True)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'cv_templates'





class DjangoAdminLog(models.Model):

    action_time = models.DateTimeField()

    object_id = models.TextField(blank=True, null=True)

    object_repr = models.CharField(max_length=200)

    action_flag = models.SmallIntegerField()

    change_message = models.TextField()

    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING, blank=True, null=True)

    user = models.ForeignKey('Users', models.DO_NOTHING)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'django_admin_log'





class DjangoContentType(models.Model):

    app_label = models.CharField(max_length=100)

    model = models.CharField(max_length=100)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'django_content_type'

        unique_together = (('app_label', 'model'),)





class DjangoEventstreamEvent(models.Model):

    channel = models.CharField(max_length=255)

    type = models.CharField(max_length=255)

    data = models.TextField()

    eid = models.BigIntegerField()

    created = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'django_eventstream_event'

        unique_together = (('channel', 'eid'),)





class DjangoEventstreamEventcounter(models.Model):

    name = models.CharField(unique=True, max_length=255)

    value = models.BigIntegerField()

    updated = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'django_eventstream_eventcounter'





class DjangoMigrations(models.Model):

    id = models.BigAutoField(primary_key=True)

    app = models.CharField(max_length=255)

    name = models.CharField(max_length=255)

    applied = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'django_migrations'





class DjangoSession(models.Model):

    session_key = models.CharField(primary_key=True, max_length=40)

    session_data = models.TextField()

    expire_date = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'django_session'





class EmailEmailtemplate(models.Model):

    id = models.BigAutoField(primary_key=True)

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    name = models.CharField(max_length=255)

    slug = models.CharField(unique=True, max_length=50)

    subject = models.CharField(max_length=255)

    body = models.TextField()

    variables = models.JSONField()

    is_active = models.BooleanField()

    category = models.ForeignKey('EmailEmailtemplatecategory', models.DO_NOTHING, blank=True, null=True)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'email_emailtemplate'





class EmailEmailtemplatecategory(models.Model):

    id = models.BigAutoField(primary_key=True)

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    name = models.CharField(max_length=255)

    slug = models.CharField(unique=True, max_length=50)

    description = models.TextField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'email_emailtemplatecategory'





class EmailSentemail(models.Model):

    id = models.BigAutoField(primary_key=True)

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    recipient = models.CharField(max_length=254)

    subject = models.CharField(max_length=255)

    content = models.TextField()

    status = models.CharField(max_length=20)

    error_message = models.TextField()

    template = models.ForeignKey(EmailEmailtemplate, models.DO_NOTHING, blank=True, null=True)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'email_sentemail'





class Faqs(models.Model):

    id = models.BigAutoField(primary_key=True)

    category = models.CharField(max_length=100)

    question = models.TextField()

    answer = models.TextField()

    is_active = models.BooleanField()

    display_order = models.IntegerField()

    view_count = models.IntegerField()

    helpful_count = models.IntegerField()

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'faqs'





class FileUploads(models.Model):

    id = models.BigAutoField(primary_key=True)

    file_name = models.CharField(max_length=255)

    original_name = models.CharField(max_length=255)

    file_path = models.CharField(max_length=500)

    file_type = models.CharField(max_length=50, blank=True, null=True)

    file_size = models.IntegerField(blank=True, null=True)

    mime_type = models.CharField(max_length=100, blank=True, null=True)

    entity_type = models.CharField(max_length=50, blank=True, null=True)

    entity_id = models.IntegerField(blank=True, null=True)

    is_public = models.BooleanField()

    created_at = models.DateTimeField()

    user = models.ForeignKey('Users', models.DO_NOTHING)

    updated_at = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'file_uploads'





class Industries(models.Model):

    id = models.BigAutoField(primary_key=True)

    name = models.CharField(max_length=100)

    slug = models.CharField(unique=True, max_length=100)

    description = models.TextField(blank=True, null=True)

    icon_url = models.CharField(max_length=255, blank=True, null=True)

    is_active = models.BooleanField()

    display_order = models.IntegerField()

    created_at = models.DateTimeField()

    parent = models.ForeignKey('self', models.DO_NOTHING, blank=True, null=True)

    updated_at = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'industries'





class InterviewInterviewers(models.Model):

    id = models.BigAutoField(primary_key=True)

    role = models.CharField(max_length=100, blank=True, null=True)

    feedback = models.TextField(blank=True, null=True)

    rating = models.IntegerField(blank=True, null=True)

    created_at = models.DateTimeField()

    interview = models.ForeignKey('Interviews', models.DO_NOTHING)

    interviewer = models.ForeignKey('Users', models.DO_NOTHING)

    updated_at = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'interview_interviewers'

        unique_together = (('interview', 'interviewer'),)





class InterviewTypes(models.Model):

    id = models.BigAutoField(primary_key=True)

    name = models.CharField(unique=True, max_length=50)

    description = models.TextField(blank=True, null=True)

    icon_url = models.CharField(max_length=255, blank=True, null=True)

    is_active = models.BooleanField()

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'interview_types'





class Interviews(models.Model):

    id = models.BigAutoField(primary_key=True)

    round_number = models.IntegerField()

    scheduled_at = models.DateTimeField()

    duration_minutes = models.IntegerField()

    meeting_link = models.CharField(max_length=500, blank=True, null=True)

    status = models.CharField(max_length=20)

    notes = models.TextField(blank=True, null=True)

    feedback = models.TextField(blank=True, null=True)

    rating = models.IntegerField(blank=True, null=True)

    role = models.CharField(max_length=100, blank=True, null=True)

    result = models.CharField(max_length=20)

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    address = models.ForeignKey(Addresses, models.DO_NOTHING, blank=True, null=True)

    application = models.ForeignKey(Applications, models.DO_NOTHING)

    created_by = models.ForeignKey('Users', models.DO_NOTHING)

    interviewer = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True, related_name='interviews_interviewer_set')

    interview_type = models.ForeignKey(InterviewTypes, models.DO_NOTHING)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'interviews'





class JobAlertMatches(models.Model):

    id = models.BigAutoField(primary_key=True)

    is_sent = models.BooleanField()

    is_viewed = models.BooleanField()

    matched_at = models.DateTimeField()

    score = models.FloatField()

    job = models.ForeignKey('Jobs', models.DO_NOTHING)

    job_alert = models.ForeignKey('JobAlerts', models.DO_NOTHING)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'job_alert_matches'

        unique_together = (('job_alert', 'job'),)





class JobAlertSkills(models.Model):

    id = models.BigAutoField(primary_key=True)

    created_at = models.DateTimeField()

    job_alert = models.ForeignKey('JobAlerts', models.DO_NOTHING)

    skill = models.ForeignKey('Skills', models.DO_NOTHING)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'job_alert_skills'

        unique_together = (('job_alert', 'skill'),)





class JobAlerts(models.Model):

    id = models.BigAutoField(primary_key=True)

    alert_name = models.CharField(max_length=255)

    keywords = models.TextField(blank=True, null=True)

    job_type = models.CharField(max_length=20, blank=True, null=True)

    level = models.CharField(max_length=20, blank=True, null=True)

    salary_min = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)

    is_active = models.BooleanField()

    frequency = models.CharField(max_length=20)

    last_sent_at = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    category = models.ForeignKey('JobCategories', models.DO_NOTHING, blank=True, null=True)

    recruiter = models.ForeignKey('Recruiters', models.DO_NOTHING)

    email_notification = models.BooleanField()

    use_ai_matching = models.BooleanField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'job_alerts'





class JobAlertsLocations(models.Model):

    id = models.BigAutoField(primary_key=True)

    jobalert = models.ForeignKey(JobAlerts, models.DO_NOTHING)

    province = models.ForeignKey('Provinces', models.DO_NOTHING)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'job_alerts_locations'

        unique_together = (('jobalert', 'province'),)





class JobAlertsSkills(models.Model):

    id = models.BigAutoField(primary_key=True)

    jobalert = models.ForeignKey(JobAlerts, models.DO_NOTHING)

    skill = models.ForeignKey('Skills', models.DO_NOTHING)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'job_alerts_skills'

        unique_together = (('jobalert', 'skill'),)





class JobCategories(models.Model):

    id = models.BigAutoField(primary_key=True)

    name = models.CharField(max_length=100)

    slug = models.CharField(unique=True, max_length=100)

    description = models.TextField(blank=True, null=True)

    icon_url = models.CharField(max_length=255, blank=True, null=True)

    is_active = models.BooleanField()

    display_order = models.IntegerField()

    created_at = models.DateTimeField()

    parent = models.ForeignKey('self', models.DO_NOTHING, blank=True, null=True)

    updated_at = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'job_categories'





class JobLocations(models.Model):

    id = models.BigAutoField(primary_key=True)

    is_primary = models.BooleanField()

    created_at = models.DateTimeField()

    address = models.ForeignKey(Addresses, models.DO_NOTHING)

    job = models.ForeignKey('Jobs', models.DO_NOTHING)

    updated_at = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'job_locations'

        unique_together = (('job', 'address'),)





class JobSearchHistory(models.Model):

    id = models.BigAutoField(primary_key=True)

    search_query = models.TextField(blank=True, null=True)

    filters = models.JSONField(blank=True, null=True)

    results_count = models.IntegerField(blank=True, null=True)

    ip_address = models.GenericIPAddressField(blank=True, null=True)

    searched_at = models.DateTimeField()

    user = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'job_search_history'





class JobSkills(models.Model):

    id = models.BigAutoField(primary_key=True)

    is_required = models.BooleanField()

    proficiency_level = models.CharField(max_length=20, blank=True, null=True)

    years_required = models.IntegerField(blank=True, null=True)

    created_at = models.DateTimeField()

    job = models.ForeignKey('Jobs', models.DO_NOTHING)

    skill = models.ForeignKey('Skills', models.DO_NOTHING)

    updated_at = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'job_skills'

        unique_together = (('job', 'skill'),)





class JobViews(models.Model):

    id = models.BigAutoField(primary_key=True)

    ip_address = models.GenericIPAddressField(blank=True, null=True)

    user_agent = models.TextField(blank=True, null=True)

    referrer = models.CharField(max_length=500, blank=True, null=True)

    viewed_at = models.DateTimeField()

    job = models.ForeignKey('Jobs', models.DO_NOTHING)

    user = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'job_views'





class Jobs(models.Model):

    id = models.BigAutoField(primary_key=True)

    title = models.CharField(max_length=255)

    slug = models.CharField(unique=True, max_length=255)

    job_type = models.CharField(max_length=20)

    level = models.CharField(max_length=20)

    experience_years_min = models.IntegerField()

    experience_years_max = models.IntegerField(blank=True, null=True)

    salary_min = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)

    salary_max = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)

    salary_currency = models.CharField(max_length=10)

    salary_type = models.CharField(max_length=20)

    is_salary_negotiable = models.BooleanField()

    number_of_positions = models.IntegerField()

    description = models.TextField()

    requirements = models.TextField()

    benefits = models.TextField(blank=True, null=True)

    is_remote = models.BooleanField()

    application_deadline = models.DateField(blank=True, null=True)

    status = models.CharField(max_length=20)

    view_count = models.IntegerField()

    application_count = models.IntegerField()

    featured = models.BooleanField()

    featured_until = models.DateField(blank=True, null=True)

    published_at = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    address = models.ForeignKey(Addresses, models.DO_NOTHING, blank=True, null=True)

    category = models.ForeignKey(JobCategories, models.DO_NOTHING, blank=True, null=True)

    company = models.ForeignKey(Companies, models.DO_NOTHING)

    created_by = models.ForeignKey('Users', models.DO_NOTHING)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'jobs'





class Languages(models.Model):

    id = models.BigAutoField(primary_key=True)

    language_code = models.CharField(unique=True, max_length=10)

    language_name = models.CharField(max_length=50)

    native_name = models.CharField(max_length=50, blank=True, null=True)

    is_active = models.BooleanField()

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'languages'





class MediaTypes(models.Model):

    id = models.BigAutoField(primary_key=True)

    type_name = models.CharField(unique=True, max_length=50)

    description = models.TextField(blank=True, null=True)

    is_active = models.BooleanField()

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'media_types'





class NotificationTypes(models.Model):

    id = models.BigAutoField(primary_key=True)

    type_name = models.CharField(unique=True, max_length=50)

    template = models.TextField(blank=True, null=True)

    is_active = models.BooleanField()

    created_at = models.DateTimeField()

    description = models.TextField(blank=True, null=True)

    updated_at = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'notification_types'





class Notifications(models.Model):

    id = models.BigAutoField(primary_key=True)

    title = models.CharField(max_length=255)

    content = models.TextField()

    link = models.CharField(max_length=500, blank=True, null=True)

    entity_type = models.CharField(max_length=50, blank=True, null=True)

    entity_id = models.IntegerField(blank=True, null=True)

    is_read = models.BooleanField()

    read_at = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField()

    notification_type = models.ForeignKey(NotificationTypes, models.DO_NOTHING)

    user = models.ForeignKey('Users', models.DO_NOTHING)

    updated_at = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'notifications'





class PaymentMethods(models.Model):

    id = models.BigAutoField(primary_key=True)

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    name = models.CharField(max_length=255)

    code = models.CharField(unique=True, max_length=50)

    config = models.JSONField()

    is_active = models.BooleanField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'payment_methods'





class Provinces(models.Model):

    id = models.BigAutoField(primary_key=True)

    province_name = models.CharField(max_length=100)

    province_type = models.CharField(max_length=20)

    region = models.CharField(max_length=10)

    is_active = models.BooleanField()

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'provinces'





class Recommendations(models.Model):

    id = models.BigAutoField(primary_key=True)

    relationship = models.CharField(max_length=100, blank=True, null=True)

    content = models.TextField()

    is_visible = models.BooleanField()

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    recommender = models.ForeignKey('Users', models.DO_NOTHING)

    recruiter = models.ForeignKey('Recruiters', models.DO_NOTHING)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'recommendations'





class RecruiterCertifications(models.Model):

    id = models.BigAutoField(primary_key=True)

    certification_name = models.CharField(max_length=255)

    issuing_organization = models.CharField(max_length=255, blank=True, null=True)

    issue_date = models.DateField(blank=True, null=True)

    expiry_date = models.DateField(blank=True, null=True)

    credential_id = models.CharField(max_length=100, blank=True, null=True)

    credential_url = models.CharField(max_length=500, blank=True, null=True)

    does_not_expire = models.BooleanField()

    display_order = models.IntegerField()

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    recruiter = models.ForeignKey('Recruiters', models.DO_NOTHING)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'recruiter_certifications'





class RecruiterConnections(models.Model):

    id = models.BigAutoField(primary_key=True)

    status = models.CharField(max_length=20)

    message = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    receiver = models.ForeignKey('Recruiters', models.DO_NOTHING)

    requester = models.ForeignKey('Recruiters', models.DO_NOTHING, related_name='recruiterconnections_requester_set')



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'recruiter_connections'

        unique_together = (('requester', 'receiver'),)





class RecruiterCvs(models.Model):

    id = models.BigAutoField(primary_key=True)

    cv_name = models.CharField(max_length=255)

    cv_data = models.JSONField()

    cv_url = models.CharField(max_length=500, blank=True, null=True)

    is_default = models.BooleanField()

    is_public = models.BooleanField()

    view_count = models.IntegerField()

    download_count = models.IntegerField()

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    recruiter = models.ForeignKey('Recruiters', models.DO_NOTHING)

    template = models.ForeignKey(CvTemplates, models.DO_NOTHING, blank=True, null=True)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'recruiter_cvs'





class RecruiterEducation(models.Model):

    id = models.BigAutoField(primary_key=True)

    school_name = models.CharField(max_length=255)

    degree = models.CharField(max_length=100, blank=True, null=True)

    field_of_study = models.CharField(max_length=100, blank=True, null=True)

    start_date = models.DateField(blank=True, null=True)

    end_date = models.DateField(blank=True, null=True)

    is_current = models.BooleanField()

    gpa = models.DecimalField(max_digits=3, decimal_places=2, blank=True, null=True)

    description = models.TextField(blank=True, null=True)

    display_order = models.IntegerField()

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    recruiter = models.ForeignKey('Recruiters', models.DO_NOTHING)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'recruiter_education'





class RecruiterExperience(models.Model):

    id = models.BigAutoField(primary_key=True)

    company_name = models.CharField(max_length=255)

    job_title = models.CharField(max_length=100)

    start_date = models.DateField()

    end_date = models.DateField(blank=True, null=True)

    is_current = models.BooleanField()

    description = models.TextField(blank=True, null=True)

    achievements = models.TextField(blank=True, null=True)

    display_order = models.IntegerField()

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    address = models.ForeignKey(Addresses, models.DO_NOTHING, blank=True, null=True)

    industry = models.ForeignKey(Industries, models.DO_NOTHING, blank=True, null=True)

    recruiter = models.ForeignKey('Recruiters', models.DO_NOTHING)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'recruiter_experience'





class RecruiterLanguages(models.Model):

    id = models.BigAutoField(primary_key=True)

    proficiency_level = models.CharField(max_length=20)

    is_native = models.BooleanField()

    created_at = models.DateTimeField()

    language = models.ForeignKey(Languages, models.DO_NOTHING)

    recruiter = models.ForeignKey('Recruiters', models.DO_NOTHING)

    updated_at = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'recruiter_languages'

        unique_together = (('recruiter', 'language'),)





class RecruiterProjects(models.Model):

    id = models.BigAutoField(primary_key=True)

    project_name = models.CharField(max_length=255)

    description = models.TextField(blank=True, null=True)

    project_url = models.CharField(max_length=500, blank=True, null=True)

    start_date = models.DateField(blank=True, null=True)

    end_date = models.DateField(blank=True, null=True)

    is_ongoing = models.BooleanField()

    technologies_used = models.TextField(blank=True, null=True)

    display_order = models.IntegerField()

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    recruiter = models.ForeignKey('Recruiters', models.DO_NOTHING)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'recruiter_projects'





class RecruiterSkills(models.Model):

    id = models.BigAutoField(primary_key=True)

    proficiency_level = models.CharField(max_length=20)

    years_of_experience = models.IntegerField(blank=True, null=True)

    is_verified = models.BooleanField()

    endorsement_count = models.IntegerField()

    last_used_date = models.DateField(blank=True, null=True)

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    recruiter = models.ForeignKey('Recruiters', models.DO_NOTHING)

    skill = models.ForeignKey('Skills', models.DO_NOTHING)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'recruiter_skills'

        unique_together = (('recruiter', 'skill'),)





class Recruiters(models.Model):

    id = models.BigAutoField(primary_key=True)

    current_position = models.CharField(max_length=100, blank=True, null=True)

    date_of_birth = models.DateField(blank=True, null=True)

    gender = models.CharField(max_length=10, blank=True, null=True)

    bio = models.TextField(blank=True, null=True)

    linkedin_url = models.CharField(max_length=255, blank=True, null=True)

    facebook_url = models.CharField(max_length=255, blank=True, null=True)

    github_url = models.CharField(max_length=255, blank=True, null=True)

    portfolio_url = models.CharField(max_length=255, blank=True, null=True)

    job_search_status = models.CharField(max_length=20)

    desired_salary_min = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)

    desired_salary_max = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)

    salary_currency = models.CharField(max_length=10)

    available_from_date = models.DateField(blank=True, null=True)

    years_of_experience = models.IntegerField()

    highest_education_level = models.CharField(max_length=20, blank=True, null=True)

    profile_completeness_score = models.IntegerField()

    is_profile_public = models.BooleanField()

    profile_views_count = models.IntegerField()

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    address = models.ForeignKey(Addresses, models.DO_NOTHING, blank=True, null=True)

    current_company = models.ForeignKey(Companies, models.DO_NOTHING, blank=True, null=True)

    user = models.OneToOneField('Users', models.DO_NOTHING)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'recruiters'





class ReportTypes(models.Model):

    id = models.BigAutoField(primary_key=True)

    type_name = models.CharField(unique=True, max_length=100)

    description = models.TextField(blank=True, null=True)

    template = models.JSONField(blank=True, null=True)

    is_active = models.BooleanField()

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'report_types'





class Reports(models.Model):

    id = models.BigAutoField(primary_key=True)

    entity_type = models.CharField(max_length=50)

    entity_id = models.IntegerField()

    description = models.TextField()

    status = models.CharField(max_length=20)

    resolved_at = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField()

    report_type = models.ForeignKey(ReportTypes, models.DO_NOTHING)

    reporter = models.ForeignKey('Users', models.DO_NOTHING)

    resolved_by = models.ForeignKey('Users', models.DO_NOTHING, related_name='reports_resolved_by_set', blank=True, null=True)

    resolution_notes = models.TextField(blank=True, null=True)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'reports'





class ReviewReactions(models.Model):

    id = models.BigAutoField(primary_key=True)

    reaction_type = models.CharField(max_length=20)

    created_at = models.DateTimeField()

    review = models.ForeignKey('Reviews', models.DO_NOTHING)

    user = models.ForeignKey('Users', models.DO_NOTHING)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'review_reactions'

        unique_together = (('review', 'user', 'reaction_type'),)





class Reviews(models.Model):

    id = models.BigAutoField(primary_key=True)

    rating = models.IntegerField()

    title = models.CharField(max_length=255, blank=True, null=True)

    content = models.TextField()

    pros = models.TextField(blank=True, null=True)

    cons = models.TextField(blank=True, null=True)

    work_environment_rating = models.IntegerField(blank=True, null=True)

    salary_benefits_rating = models.IntegerField(blank=True, null=True)

    management_rating = models.IntegerField(blank=True, null=True)

    career_development_rating = models.IntegerField(blank=True, null=True)

    employment_status = models.CharField(max_length=20, blank=True, null=True)

    position = models.CharField(max_length=100, blank=True, null=True)

    employment_duration = models.CharField(max_length=50, blank=True, null=True)

    is_verified = models.BooleanField()

    is_anonymous = models.BooleanField()

    helpful_count = models.IntegerField()

    status = models.CharField(max_length=20)

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    company = models.ForeignKey(Companies, models.DO_NOTHING)

    recruiter = models.ForeignKey(Recruiters, models.DO_NOTHING)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'reviews'





class SavedJobs(models.Model):

    id = models.BigAutoField(primary_key=True)

    folder_name = models.CharField(max_length=100, blank=True, null=True)

    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField()

    job = models.ForeignKey(Jobs, models.DO_NOTHING)

    recruiter = models.ForeignKey(Recruiters, models.DO_NOTHING)

    updated_at = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'saved_jobs'

        unique_together = (('recruiter', 'job'),)





class SearchHistory(models.Model):

    id = models.BigAutoField(primary_key=True)

    search_query = models.CharField(max_length=500)

    search_type = models.CharField(max_length=50, blank=True, null=True)

    filters = models.JSONField(blank=True, null=True)

    results_count = models.IntegerField()

    ip_address = models.GenericIPAddressField(blank=True, null=True)

    user_agent = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField()

    user = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'search_history'





class SkillCategories(models.Model):

    id = models.BigAutoField(primary_key=True)

    name = models.CharField(max_length=100)

    slug = models.CharField(unique=True, max_length=100)

    description = models.TextField(blank=True, null=True)

    is_active = models.BooleanField()

    display_order = models.IntegerField()

    created_at = models.DateTimeField()

    parent = models.ForeignKey('self', models.DO_NOTHING, blank=True, null=True)

    updated_at = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'skill_categories'





class SkillEndorsements(models.Model):

    id = models.BigAutoField(primary_key=True)

    relationship = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField()

    endorsed_by = models.ForeignKey(Recruiters, models.DO_NOTHING)

    recruiter_skill = models.ForeignKey(RecruiterSkills, models.DO_NOTHING)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'skill_endorsements'

        unique_together = (('recruiter_skill', 'endorsed_by'),)





class Skills(models.Model):

    id = models.BigAutoField(primary_key=True)

    name = models.CharField(unique=True, max_length=100)

    slug = models.CharField(unique=True, max_length=100)

    description = models.TextField(blank=True, null=True)

    is_verified = models.BooleanField()

    usage_count = models.IntegerField()

    created_at = models.DateTimeField()

    category = models.ForeignKey(SkillCategories, models.DO_NOTHING)

    is_active = models.BooleanField()

    updated_at = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'skills'





class SubscriptionPlans(models.Model):

    id = models.BigAutoField(primary_key=True)

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    name = models.CharField(max_length=255)

    slug = models.CharField(unique=True, max_length=50)

    price = models.DecimalField(max_digits=12, decimal_places=2)

    currency = models.CharField(max_length=10)

    duration_days = models.IntegerField()

    features = models.JSONField()

    is_active = models.BooleanField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'subscription_plans'





class SystemSettings(models.Model):

    id = models.BigAutoField(primary_key=True)

    setting_key = models.CharField(unique=True, max_length=100)

    setting_value = models.TextField(blank=True, null=True)

    setting_type = models.CharField(max_length=20)

    category = models.CharField(max_length=50, blank=True, null=True)

    description = models.TextField(blank=True, null=True)

    is_public = models.BooleanField()

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    updated_by = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'system_settings'





class TokenBlacklistBlacklistedtoken(models.Model):

    id = models.BigAutoField(primary_key=True)

    blacklisted_at = models.DateTimeField()

    token = models.OneToOneField('TokenBlacklistOutstandingtoken', models.DO_NOTHING)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'token_blacklist_blacklistedtoken'





class TokenBlacklistOutstandingtoken(models.Model):

    id = models.BigAutoField(primary_key=True)

    token = models.TextField()

    created_at = models.DateTimeField(blank=True, null=True)

    expires_at = models.DateTimeField()

    user = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)

    jti = models.CharField(unique=True, max_length=255)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'token_blacklist_outstandingtoken'





class Transactions(models.Model):

    id = models.BigAutoField(primary_key=True)

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    amount = models.DecimalField(max_digits=12, decimal_places=2)

    currency = models.CharField(max_length=10)

    type = models.CharField(max_length=20)

    status = models.CharField(max_length=20)

    reference_code = models.CharField(unique=True, max_length=100, blank=True, null=True)

    description = models.TextField()

    company = models.ForeignKey(Companies, models.DO_NOTHING)

    payment_method = models.ForeignKey(PaymentMethods, models.DO_NOTHING, blank=True, null=True)

    ip_address = models.GenericIPAddressField(blank=True, null=True)

    vnp_bankcode = models.CharField(db_column='vnp_BankCode', max_length=50, blank=True, null=True)  # Field name made lowercase.

    vnp_cardtype = models.CharField(db_column='vnp_CardType', max_length=50, blank=True, null=True)  # Field name made lowercase.

    vnp_orderinfo = models.TextField(db_column='vnp_OrderInfo', blank=True, null=True)  # Field name made lowercase.

    vnp_transactionno = models.CharField(db_column='vnp_TransactionNo', max_length=100, blank=True, null=True)  # Field name made lowercase.

    metadata = models.JSONField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'transactions'





class UserPasskeys(models.Model):

    id = models.BigAutoField(primary_key=True)

    credential_id = models.BinaryField(unique=True)

    public_key = models.BinaryField()

    sign_count = models.IntegerField()

    device_name = models.CharField(max_length=255)

    aaguid = models.CharField(max_length=36)

    transports = models.JSONField()

    is_active = models.BooleanField()

    created_at = models.DateTimeField()

    last_used_at = models.DateTimeField(blank=True, null=True)

    user = models.ForeignKey('Users', models.DO_NOTHING)

    updated_at = models.DateTimeField()



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'user_passkeys'





class Users(models.Model):

    id = models.BigAutoField(primary_key=True)

    password = models.CharField(max_length=128)

    last_login = models.DateTimeField(blank=True, null=True)

    is_superuser = models.BooleanField()

    first_name = models.CharField(max_length=150)

    last_name = models.CharField(max_length=150)

    is_staff = models.BooleanField()

    is_active = models.BooleanField()

    date_joined = models.DateTimeField()

    email = models.CharField(unique=True, max_length=254)

    full_name = models.CharField(max_length=255)

    phone = models.CharField(max_length=20, blank=True, null=True)

    avatar_url = models.CharField(max_length=500, blank=True, null=True)

    role = models.CharField(max_length=20)

    status = models.CharField(max_length=20)

    email_verified = models.BooleanField()

    email_verification_token = models.CharField(max_length=255, blank=True, null=True)

    password_reset_token = models.CharField(max_length=255, blank=True, null=True)

    password_reset_expires = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    two_factor_enabled = models.BooleanField()

    two_factor_secret = models.CharField(max_length=255, blank=True, null=True)

    social_id = models.CharField(unique=True, max_length=255, blank=True, null=True)

    social_provider = models.CharField(max_length=20)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'users'





class UsersGroups(models.Model):

    id = models.BigAutoField(primary_key=True)

    customuser = models.ForeignKey(Users, models.DO_NOTHING)

    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'users_groups'

        unique_together = (('customuser', 'group'),)





class UsersUserPermissions(models.Model):

    id = models.BigAutoField(primary_key=True)

    customuser = models.ForeignKey(Users, models.DO_NOTHING)

    permission = models.ForeignKey(AuthPermission, models.DO_NOTHING)



    class Meta:
        app_label = 'contenttypes'

        managed = False

        db_table = 'users_user_permissions'

        unique_together = (('customuser', 'permission'),)

