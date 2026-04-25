from apps.communication.notification_types.models import NotificationType

def seed_notification_types():
    types = [
        ('system', 'Thông báo hệ thống', 'Thông báo chung từ hệ thống'),
        ('application', 'Ứng tuyển', 'Thông báo về hồ sơ ứng tuyển'),
        ('interview', 'Phỏng vấn', 'Thông báo về lịch phỏng vấn'),
        ('verification', 'Xác thực', 'Thông báo về việc xác thực tài khoản/công ty'),
        ('report', 'Báo cáo', 'Thông báo về báo cáo vi phạm'),
        ('job_alert', 'Gợi ý việc làm', 'Thông báo việc làm phù hợp'),
    ]
    
    for type_name, display_name, description in types:
        obj, created = NotificationType.objects.get_or_create(
            type_name=type_name,
            defaults={
                'display_name': display_name,
                'description': description,
                'is_active': True
            }
        )
        if created:
            print(f"Created notification type: {type_name}")
        else:
            print(f"Notification type already exists: {type_name}")

if __name__ == "__main__":
    seed_notification_types()
