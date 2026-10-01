from apps.company.companies.models import Company, CompanyMember
from apps.core.users.permissions import is_admin_user


MANAGE_COMPANY_ROLES = {CompanyMember.Role.OWNER, CompanyMember.Role.ADMIN}
MANAGE_MEMBER_ROLES = {CompanyMember.Role.OWNER, CompanyMember.Role.ADMIN}
MANAGE_JOB_ROLES = {
    CompanyMember.Role.OWNER,
    CompanyMember.Role.ADMIN,
    CompanyMember.Role.RECRUITER,
}
VIEW_COMPANY_ROLES = {
    CompanyMember.Role.OWNER,
    CompanyMember.Role.ADMIN,
    CompanyMember.Role.RECRUITER,
    CompanyMember.Role.VIEWER,
}


def get_company_role(company: Company, user) -> str | None:
    if not user or not getattr(user, "is_authenticated", False):
        return None
    if is_admin_user(user):
        return CompanyMember.Role.ADMIN
    if company.user_id and company.user_id == user.id:
        return CompanyMember.Role.OWNER

    membership = (
        CompanyMember.objects.filter(
            company=company,
            user=user,
            status=CompanyMember.Status.ACTIVE,
        )
        .only("role")
        .first()
    )
    return membership.role if membership else None


def has_company_role(company: Company, user, roles: set[str]) -> bool:
    role = get_company_role(company, user)
    return bool(role and role in roles)


def can_view_company_panel(company: Company, user) -> bool:
    return has_company_role(company, user, VIEW_COMPANY_ROLES)


def can_manage_company_profile(company: Company, user) -> bool:
    return has_company_role(company, user, MANAGE_COMPANY_ROLES)


def can_manage_company_members(company: Company, user) -> bool:
    return has_company_role(company, user, MANAGE_MEMBER_ROLES)


def can_manage_company_jobs(company: Company, user) -> bool:
    return has_company_role(company, user, MANAGE_JOB_ROLES)
