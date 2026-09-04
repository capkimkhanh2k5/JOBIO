import re

path = 'frontend/src/components/jobs/JobDetailHeader.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '<img src={job.company?.logo_url} alt={job.company?.company_name} className="w-full h-full object-contain" />',
    '<img src={job.company?.logo_url} alt={job.company?.company_name} className="w-full h-full object-contain" loading="eager" fetchPriority="high" />'
)

content = content.replace(
    '<img src={job.company?.logo_url} alt={job.company?.company_name} className="w-full h-full object-contain p-1" />',
    '<img src={job.company?.logo_url} alt={job.company?.company_name} className="w-full h-full object-contain p-1" loading="eager" fetchPriority="high" />'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
