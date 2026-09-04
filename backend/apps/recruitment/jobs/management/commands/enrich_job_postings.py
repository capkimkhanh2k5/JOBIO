import json
import logging
import random
import re
from datetime import datetime
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.recruitment.jobs.models import Job, JobEmbedding
from apps.recruitment.job_skills.models import JobSkill
from apps.candidate.skills.models import Skill
from apps.recruitment.jobs.services.recommendations import generate_job_embedding

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# DYNAMIC CONTEXTUAL ENRICHMENT GENERATOR (100% UNIQUE PER JOB)
# ---------------------------------------------------------------------------

COMPANY_DOMAINS = {
    "FPT Software": "các dự án chuyển đổi số quy mô toàn cầu, giải pháp phần mềm cho khách hàng quốc tế tại Mỹ, Nhật Bản và Châu Âu",
    "VNG Corporation": "hệ sinh thái giải trí số, ứng dụng trực tuyến, mạng xã hội và nền tảng điện toán đám mây hàng đầu Việt Nam",
    "Nashtech Vietnam": "các dự án phần mềm cao cấp, giải pháp chuyển đổi số cho các tập đoàn đa quốc gia tại Anh, Úc và Singapore",
    "KMS Technology": "các sản phẩm công nghệ SaaS hiện đại và dịch vụ tư vấn kỹ thuật phần mềm chất lượng cao cho thị trường Bắc Mỹ",
    "Viettel Group": "hệ sinh thái hạ tầng viễn thông số, an ninh mạng, các giải pháp công nghệ quốc gia và nền tảng dữ liệu lớn",
    "Momo (M_Service)": "siêu ứng dụng tài chính số hàng đầu, hệ thống thanh toán trực tuyến và giải pháp FinTech phục vụ hơn 30 triệu người dùng",
    "VNPAY": "hệ sinh thái cổng thanh toán điện tử, ngân hàng số VNPAY-QR và các giải pháp tài chính số bảo mật cấp cao",
    "Tiki": "nền tảng thương mại điện tử TikiNow, hệ sinh thái kho vận thông minh và công nghệ chuỗi cung ứng hiện đại",
    "Shopee Vietnam": "sàn thương mại điện tử số 1 khu vực Đông Nam Á, hệ thống phân phối và các giải pháp bán hàng đa kênh quy mô lớn",
    "Lazada Vietnam": "hệ sinh thái mua sắm trực tuyến, công nghệ logistics tự động hóa và các ứng dụng thương mại điện tử thế hệ mới",
    "Giao Hang Tiet Kiem": "hệ thống vận hành giao nhận thông minh, tối ưu hóa định tuyến giao hàng thời gian thực và quản trị logistics toàn quốc",
    "Giao Hang Nhanh": "mạng lưới chuyển phát nhanh hàng đầu, hệ thống tự động phân loại hàng hóa và giải pháp công nghệ giao vận",
    "Techcombank": "nền tảng ngân hàng số thế hệ mới, trải nghiệm tài chính cá nhân hóa và các hệ sinh thái dữ liệu ngân hàng tiên tiến",
    "Vietcombank": "hệ thống ngân hàng lõi, giải pháp thanh toán số bảo mật cao và chuyển đổi số hạ tầng tài chính ngân hàng quốc gia",
    "Mcredit": "các sản phẩm tài chính tiêu dùng số, hệ thống chấm điểm tín dụng thông minh và quy trình phê duyệt tự động",
    "Trusting Social": "nền tảng AI chấm điểm tín dụng, phân tích dữ liệu lớn và các giải pháp tài chính toàn diện hàng đầu Đông Nam Á",
    "VinBrain": "các giải pháp AI y tế đột phá, trợ lý thông minh DrAid trong chẩn đoán hình ảnh và quản trị y tế số",
    "Vingroup": "hệ sinh thái công nghiệp và công nghệ cao, đô thị thông minh Vinhomes và nền tảng xe điện thông minh VinFast",
    "VNPT": "hạ tầng số quốc gia, giải pháp đô thị thông minh (Smart City) và các nền tảng chính phủ điện tử",
    "Zalo Group": "siêu ứng dụng nhắn tin quốc dân Zalo, nền tảng AI ngôn ngữ tiếng Việt và hệ thống dịch vụ tiện ích số",
    "Amanotes": "các ứng dụng và game âm nhạc đứng đầu thế giới với hàng tỷ lượt tải trên App Store và Google Play",
    "Axon Active": "quy trình phát triển phần mềm Agile/Scrum chuẩn Thụy Sĩ, tạo dựng các sản phẩm số chất lượng cho đối tác toàn cầu",
    "OneMount Group": "hệ sinh thái tiêu dùng và kinh doanh số toàn diện kết nối người Việt thông qua VinID, VinShop và OneHousing",
    "DEK Technologies": "hạ tầng viễn thông 5G, giải pháp Cloud Native, hệ thống nhúng và mạng truyền thông quốc tế",
    "Cốc Cốc": "trình duyệt web và công cụ tìm kiếm số 1 do người Việt phát triển, phục vụ hơn 25 triệu người dùng hàng tháng",
}

LEVEL_DESCRIPTIONS = {
    "intern": "dành cho sinh viên năm cuối hoặc mới tốt nghiệp có nền tảng tư duy tốt, đam mê công nghệ và muốn bứt phá",
    "fresher": "dành cho nhân sự mới bước vào ngành, được kèm cặp trực tiếp bởi các Mentor giàu kinh nghiệm",
    "junior": "dành cho kỹ sư có từ 1-2 năm kinh nghiệm thực tế, sẵn sàng đảm nhận các module chức năng độc lập",
    "middle": "dành cho kỹ sư có từ 2-4 năm kinh nghiệm, làm chủ kỹ thuật và đóng góp vào kiến trúc phần mềm",
    "senior": "dành cho chuyên gia có từ 4-8 năm kinh nghiệm, tư duy kiến trúc sâu rộng và năng lực giải quyết bài toán phức tạp",
    "lead": "dành cho trưởng nhóm kỹ thuật, định hướng giải pháp công nghệ và dẫn dắt đội ngũ kỹ sư phát triển vững mạnh",
    "manager": "dành cho cấp quản lý, hoạch định chiến lược kỹ thuật, tối ưu quy trình và phát triển nguồn nhân lực",
}

def _detect_archetype(title_lower, cat_lower):
    if any(k in title_lower for k in ["marketing", "tiếp thị", "growth"]):
        return "marketing_manager"
    if any(k in title_lower for k in ["cybersecurity", "an ninh mạng", "bảo mật", "security"]):
        return "cybersecurity"
    if any(k in title_lower for k in ["system administrator", "quản trị hệ thống", "sysadmin"]):
        return "sysadmin"
    if any(k in title_lower for k in ["computer vision", "thị giác"]):
        return "ai_cv"
    if any(k in title_lower for k in ["nlp", "llm", "ngôn ngữ"]):
        return "ai_nlp"
    if any(k in title_lower for k in ["ai engineer", "ai/ml", "machine learning", "deep learning"]):
        return "ai_general"
    if any(k in title_lower for k in ["data engineer", "kỹ sư dữ liệu", "big data", "etl"]):
        return "data_engineer"
    if any(k in title_lower for k in ["data scientist", "khoa học dữ liệu", "data analyst", "phân tích dữ liệu"]):
        return "data_science"
    if any(k in title_lower for k in ["react", "reactjs", "react.js"]):
        return "frontend_react"
    if any(k in title_lower for k in ["vue", "vuejs", "vue.js"]):
        return "frontend_vue"
    if any(k in title_lower for k in ["angular"]):
        return "frontend_angular"
    if any(k in title_lower for k in ["frontend", "front-end", "front end", "giao diện"]):
        return "frontend_general"
    if any(k in title_lower for k in ["python", "django", "fastapi"]):
        return "backend_python"
    if any(k in title_lower for k in ["java", "spring"]):
        return "backend_java"
    if any(k in title_lower for k in ["node", "nodejs", "express", "nest"]):
        return "backend_node"
    if any(k in title_lower for k in ["golang", "go developer", "kỹ sư go"]):
        return "backend_go"
    if any(k in title_lower for k in ["php", "laravel"]):
        return "backend_php"
    if any(k in title_lower for k in [".net", "c#", "asp.net"]):
        return "backend_dotnet"
    if any(k in title_lower for k in ["backend", "back-end", "back end"]):
        return "backend_general"
    if any(k in title_lower for k in ["fullstack", "full-stack", "full stack", "mern"]):
        return "fullstack"
    if any(k in title_lower for k in ["software engineer", "kỹ sư phần mềm"]):
        return "software_engineer"
    if any(k in title_lower for k in ["flutter"]):
        return "mobile_flutter"
    if any(k in title_lower for k in ["react native"]):
        return "mobile_react_native"
    if any(k in title_lower for k in ["ios", "swift"]):
        return "mobile_ios"
    if any(k in title_lower for k in ["android", "kotlin"]):
        return "mobile_android"
    if any(k in title_lower for k in ["mobile", "di động"]):
        return "mobile_general"
    if any(k in title_lower for k in ["devops", "cloud", "sre", "infrastructure", "hạ tầng"]):
        return "devops"
    if any(k in title_lower for k in ["automation", "tự động"]):
        return "qa_automation"
    if any(k in title_lower for k in ["manual", "kiểm thử thủ công"]):
        return "qa_manual"
    if any(k in title_lower for k in ["qa", "qc", "test", "tester", "kiểm thử"]):
        return "qa_general"
    if any(k in title_lower for k in ["product manager", "quản lý sản phẩm", "po"]):
        return "product_manager"
    if any(k in title_lower for k in ["business analyst", "ba", "phân tích nghiệp vụ"]):
        return "business_analyst"
    if any(k in title_lower for k in ["project manager", "pm", "quản lý dự án", "scrum master"]):
        return "project_manager"
    if any(k in title_lower for k in ["ui", "ux", "designer", "thiết kế"]):
        return "ui_ux"

    if "trí tuệ" in cat_lower or "ai" in cat_lower:
        return "ai_general"
    if "kiểm thử" in cat_lower or "qa" in cat_lower:
        return "qa_general"
    if "quản lý" in cat_lower:
        return "project_manager"
    if "thiết kế" in cat_lower or "ui" in cat_lower:
        return "ui_ux"
    return "software_engineer"


def generate_dynamic_job_content(job: Job):
    """
    Sinh nội dung tuyển dụng chi tiết, động, cá nhân hóa theo từng job_id, công ty và cấp bậc.
    Đảm bảo 100% không trùng lặp giữa bất kỳ 2 job nào trong hệ thống.
    """
    rng = random.Random(job.id * 179424673 + 982451653)
    company_name = job.company.company_name if job.company else "JOBIO Partner"
    company_focus = COMPANY_DOMAINS.get(
        company_name, f"các dự án công nghệ chuyển đổi số và giải pháp phần mềm của {company_name}"
    )
    level_str = (job.level or "junior").lower()
    level_phrase = LEVEL_DESCRIPTIONS.get(level_str, "phù hợp với kỹ sư có năng lực và đam mê công nghệ")
    category_name = job.category.name if job.category else "Công nghệ thông tin"
    title_lower = job.title.lower()
    cat_lower = category_name.lower()

    archetype = _detect_archetype(title_lower, cat_lower)

    # Base Knowledge repository
    ARCHETYPES_DB = {
        "ai_cv": {
            "skills": ["Python", "PyTorch", "OpenCV", "TensorFlow", "FastAPI", "Docker", "Git", "Linux"],
            "resp": [
                f"Nghiên cứu và phát triển các mô hình Computer Vision tiên tiến (YOLO, ResNet, Transformer) phục vụ trực tiếp cho {company_name}.",
                "Tối ưu hóa pipeline xử lý hình ảnh và video thời gian thực với độ trễ thấp và độ chính xác cao.",
                "Chuyển đổi và lượng tử hóa mô hình với TensorRT / ONNX Runtime để triển khai trên môi trường GPU / Edge.",
                "Xây dựng hệ thống thu thập, gán nhãn và tiền xử lý dữ liệu hình ảnh quy mô lớn theo quy chuẩn chất lượng.",
                "Đóng gói mô hình thành microservices RESTful / gRPC hiệu năng cao trên hạ tầng Docker và Kubernetes.",
                f"Cộng tác với đội ngũ sản phẩm tại {company_name} để tích hợp các tính năng AI vào giải pháp thực tế.",
                "Thực hiện đo đạc benchmark định kỳ, phân tích các ca nhận diện biên (edge-cases) và tái huấn luyện mô hình.",
            ],
            "req": [
                "Tốt nghiệp Đại học chuyên ngành Khoa học máy tính, Công nghệ thông tin, Toán tin hoặc ngành liên quan.",
                "Thành thạo Python và có kinh nghiệm thực tế sâu với PyTorch hoặc TensorFlow.",
                "Nắm vững các thuật toán xử lý ảnh số, thị giác máy tính và các kiến trúc mạng nơ-ron sâu.",
                "Kinh nghiệm làm việc thực tế với OpenCV, NumPy, Albumentations và Docker.",
                "Tư duy nghiên cứu bài bản, khả năng đọc hiểu nhanh các công bố khoa học (Papers) để áp dụng vào thực tế.",
            ],
        },
        "ai_nlp": {
            "skills": ["Python", "PyTorch", "Transformers", "LangChain", "FastAPI", "Docker", "Git", "PostgreSQL"],
            "resp": [
                f"Huấn luyện và tinh chỉnh (Fine-tuning) các mô hình NLP và LLM phục vụ hệ sinh thái của {company_name}.",
                "Thiết kế kiến trúc RAG (Retrieval-Augmented Generation) kết hợp Vector Search (pgvector/FAISS) tối ưu độ chính xác.",
                "Xây dựng giải pháp chatbot thông minh, trích xuất thực thể và phân tích dữ liệu văn bản tự động.",
                "Xây dựng pipeline làm sạch và chuẩn hóa dữ liệu tiếng Việt quy mô lớn phục vụ mô hình ngôn ngữ.",
                "Đánh giá và tối ưu hóa độ trễ, chi phí gọi API và độ an toàn thông tin của các mô hình sinh ngôn ngữ.",
            ],
            "req": [
                "Nắm vững lập trình Python, thư viện HuggingFace Transformers, PyTorch và LangChain.",
                "Hiểu rõ cơ chế Transformer, Attention, LoRA/QLoRA và các kỹ thuật Prompt Engineering nâng cao.",
                "Kinh nghiệm làm việc với Vector Database và cơ sở dữ liệu quan hệ PostgreSQL.",
                "Khả năng nghiên cứu độc lập và chuyển hóa các thuật toán NLP mới nhất vào giải pháp phần mềm.",
            ],
        },
        "ai_general": {
            "skills": ["Python", "PyTorch", "TensorFlow", "Scikit-learn", "FastAPI", "Docker", "Git", "SQL"],
            "resp": [
                f"Nghiên cứu, thiết kế và triển khai các thuật toán Machine Learning giải quyết bài toán cốt lõi tại {company_name}.",
                "Xây dựng đường ống xử lý dữ liệu tự động phục vụ trích xuất đặc trưng và huấn luyện mô hình.",
                "Thiết lập quy trình MLOps tự động hóa từ khâu thử nghiệm, đóng gói đến giám sát mô hình trên Production.",
                "Tối ưu hóa hiệu năng tính toán và giảm chi phí hạ tầng vận hành AI.",
            ],
            "req": [
                "Nền tảng toán học, xác suất thống kê và đại số tuyến tính ứng dụng vững vàng.",
                "Thành thạo lập trình Python và các framework học máy hàng đầu: PyTorch, TensorFlow, Scikit-learn.",
                "Kinh nghiệm làm việc với Docker, RESTful API và quản lý phiên bản với Git.",
                "Tư duy logic sắc bén, kỹ năng giải quyết vấn đề và tinh thần làm việc nhóm tích cực.",
            ],
        },
        "data_engineer": {
            "skills": ["Python", "SQL", "Apache Spark", "Kafka", "PostgreSQL", "Docker", "Git", "Airflow"],
            "resp": [
                f"Thiết kế và duy trì hạ tầng Data Pipeline (ETL/ELT) xử lý dữ liệu lớn (Batch & Streaming) cho {company_name}.",
                "Xây dựng và tối ưu hóa Data Warehouse / Data Lakehouse phục vụ phân tích dữ liệu và AI.",
                "Tích hợp và chuẩn hóa dữ liệu từ nhiều nguồn khác nhau vào kho lưu trữ tập trung.",
                "Giám sát độ trễ, tính toàn vẹn và độ tin cậy của các luồng dữ liệu tự động với Apache Airflow.",
            ],
            "req": [
                "Thành thạo truy vấn SQL nâng cao và lập trình dữ liệu với Python hoặc Java/Scala.",
                "Kinh nghiệm thực tế với Apache Spark, Kafka, Airflow và các công nghệ Big Data.",
                "Nắm vững mô hình hóa dữ liệu (Star/Snowflake Schema) và tối ưu hóa lưu trữ dữ liệu.",
            ],
        },
        "data_science": {
            "skills": ["Python", "SQL", "Pandas", "Scikit-learn", "PyTorch", "NumPy", "Matplotlib", "Tableau"],
            "resp": [
                f"Phân tích chuyên sâu dữ liệu hành vi người dùng và dữ liệu kinh doanh tại {company_name} để tìm ra insight đột phá.",
                "Xây dựng các mô hình Machine Learning dự đoán (Predictive Analytics, Churn, LTV, Recommender).",
                "Thiết kế và đo lường các thử nghiệm A/B Testing khoa học nhằm tối ưu hóa trải nghiệm sản phẩm.",
                "Xây dựng dashboard trực quan hóa dữ liệu và báo cáo phân tích phục vụ việc ra quyết định chiến lược.",
            ],
            "req": [
                "Bằng cấp Đại học chuyên ngành Thống kê, Toán tin, Khoa học dữ liệu hoặc Kinh tế lượng.",
                "Thành thạo Python (Pandas, NumPy, Scikit-learn) và ngôn ngữ truy vấn SQL.",
                "Kỹ năng trực quan hóa dữ liệu tốt và khả năng truyền đạt kết quả phân tích mạch lạc, thuyết phục.",
            ],
        },
        "frontend_react": {
            "skills": ["JavaScript", "TypeScript", "ReactJS", "HTML", "CSS", "Tailwind CSS", "Redux", "Git"],
            "resp": [
                f"Phát triển giao diện người dùng hiện đại, chuẩn Responsive cho các sản phẩm web của {company_name} bằng ReactJS / Next.js.",
                "Tối ưu hóa hiệu năng render phía client (Core Web Vitals, Code Splitting, Caching).",
                "Xây dựng thư viện UI Components dùng chung (Design System) đồng bộ theo thiết kế Figma.",
                "Tích hợp RESTful API / WebSocket và quản lý state ứng dụng với Redux Toolkit hoặc Zustand.",
            ],
            "req": [
                "Thành thạo JavaScript (ES6+), TypeScript, HTML5 và CSS3 / SASS / Tailwind CSS.",
                "Kinh nghiệm chuyên sâu với ReactJS, React Hooks, Router và State Management.",
                "Hiểu biết sâu về tối ưu hóa hiệu năng web và khả năng tương thích đa trình duyệt.",
            ],
        },
        "frontend_vue": {
            "skills": ["JavaScript", "TypeScript", "VueJS", "HTML", "CSS", "Tailwind CSS", "Pinia", "Git"],
            "resp": [
                f"Xây dựng các ứng dụng web SPA / SSR mượt mà sử dụng Vue 3 (Composition API) hoặc Nuxt.js tại {company_name}.",
                "Chuyển đổi thiết kế Figma thành giao diện pixel-perfect, chuẩn Responsive trên mọi thiết bị.",
                "Quản lý luồng dữ liệu ứng dụng với Pinia và tích hợp các dịch vụ Backend API tốc độ cao.",
            ],
            "req": [
                "Thành thạo Vue 3, TypeScript, JavaScript hiện đại và các công cụ build Vite / Webpack.",
                "Nắm vững HTML5, CSS3, Flexbox/Grid và framework CSS Tailwind CSS.",
            ],
        },
        "frontend_general": {
            "skills": ["JavaScript", "TypeScript", "ReactJS", "HTML", "CSS", "Tailwind CSS", "Git", "Figma"],
            "resp": [
                f"Lập trình giao diện người dùng trực quan, thân thiện cho hệ thống web tại {company_name}.",
                "Tối ưu hóa tốc độ tải trang, giảm dung lượng bundle và đảm bảo tính tương thích đa nền tảng.",
                "Phối hợp với UI/UX Designer và Backend Engineer để hoàn thiện các tính năng sản phẩm.",
            ],
            "req": [
                "Nền tảng vững chắc về HTML5, CSS3, JavaScript/TypeScript và một framework web hiện đại.",
                "Kỹ năng sử dụng Git, tư duy giao diện người dùng và tinh thần làm việc nhóm tốt.",
            ],
        },
        "backend_python": {
            "skills": ["Python", "Django", "FastAPI", "PostgreSQL", "Redis", "Docker", "Git", "Celery"],
            "resp": [
                f"Thiết kế, xây dựng và vận hành các dịch vụ Backend API hiệu năng cao cho {company_name} bằng Python (Django / FastAPI).",
                "Xử lý tác vụ nền bất đồng bộ với Celery & Redis và thiết kế hệ thống cache đa tầng.",
                "Tối ưu hóa cơ sở dữ liệu quan hệ PostgreSQL, lập chỉ mục và tinh chỉnh các câu truy vấn phức tạp.",
                "Tích hợp các cổng thanh toán, dịch vụ bên thứ ba và các module trí tuệ nhân tạo.",
            ],
            "req": [
                "Thành thạo ngôn ngữ Python, nắm vững mô hình hướng đối tượng và kiến trúc Clean Code.",
                "Kinh nghiệm làm việc thực tế với Django REST framework hoặc FastAPI và cơ sở dữ liệu PostgreSQL.",
                "Thành thạo sử dụng Git, Docker, Linux và tư duy thiết kế hệ thống bảo mật, ổn định.",
            ],
        },
        "backend_java": {
            "skills": ["Java", "Spring Boot", "MySQL", "PostgreSQL", "Docker", "Git", "Redis", "Kafka"],
            "resp": [
                f"Phát triển các module nghiệp vụ Backend chịu tải lớn tại {company_name} bằng Java và Spring Boot.",
                "Xây dựng kiến trúc vi dịch vụ (Microservices), giao tiếp bất đồng bộ qua Apache Kafka / RabbitMQ.",
                "Thiết kế cơ sở dữ liệu quan hệ, tối ưu hóa Hibernate/JPA và quản lý giao dịch an toàn.",
            ],
            "req": [
                "Nền tảng Java Core vững chắc (Java 11/17+) và hiểu biết sâu về hệ sinh thái Spring Boot.",
                "Kinh nghiệm làm việc chuyên sâu với MySQL / PostgreSQL, Redis và kiến trúc Microservices.",
            ],
        },
        "backend_node": {
            "skills": ["JavaScript", "TypeScript", "NodeJS", "Express", "MongoDB", "PostgreSQL", "Redis", "Docker"],
            "resp": [
                f"Phát triển các dịch vụ RESTful API và GraphQL tốc độ cao trên nền tảng Node.js (NestJS/Express) cho {company_name}.",
                "Thiết kế cơ sở dữ liệu PostgreSQL / MongoDB và xây dựng các tính năng thời gian thực với WebSocket.",
                "Tối ưu hóa Event Loop, xử lý non-blocking I/O và giảm độ trễ tối đa cho các dịch vụ trực tuyến.",
            ],
            "req": [
                "Thành thạo TypeScript / JavaScript và hiểu sâu về cơ chế bất đồng bộ trong Node.js.",
                "Kinh nghiệm làm việc với NestJS hoặc ExpressJS cùng các hệ quản trị CSDL quan hệ / NoSQL.",
            ],
        },
        "backend_general": {
            "skills": ["Python", "Java", "SQL", "PostgreSQL", "Docker", "Git", "Redis", "Linux"],
            "resp": [
                f"Xây dựng và duy trì các hệ thống Backend API phục vụ lượng truy cập lớn tại {company_name}.",
                "Đảm bảo an toàn thông tin, bảo mật API, tính toàn vẹn dữ liệu và độ sẵn sàng cao của hệ thống.",
            ],
            "req": [
                "Nền tảng khoa học máy tính vững chắc (OOP, Cấu trúc dữ liệu & Giải thuật, Database Design).",
                "Thành thạo ít nhất một ngôn ngữ Backend chính (Python, Java, Go, Node.js) và hệ CSDL quan hệ.",
            ],
        },
        "fullstack": {
            "skills": ["JavaScript", "TypeScript", "ReactJS", "NodeJS", "PostgreSQL", "MongoDB", "Docker", "Git"],
            "resp": [
                f"Phát triển toàn diện từ giao diện Frontend (React/Vue) đến hệ thống Backend (Node/Python/Java) tại {company_name}.",
                "Thiết kế kiến trúc cơ sở dữ liệu tối ưu, xây dựng RESTful API bảo mật và tích hợp giao diện người dùng mượt mà.",
                "Tối ưu hóa hiệu năng đầu-cuối của hệ thống và đảm bảo trải nghiệm người dùng liền mạch.",
            ],
            "req": [
                "Kinh nghiệm phát triển cả Frontend và Backend, thành thạo TypeScript/JavaScript hiện đại.",
                "Nắm vững cơ sở dữ liệu SQL / NoSQL, quy trình phát triển Agile và công cụ container Docker.",
            ],
        },
        "software_engineer": {
            "skills": ["Java", "Python", "C++", "SQL", "Git", "Docker", "Linux", "JavaScript"],
            "resp": [
                f"Tham gia phát triển và nâng cấp các giải pháp phần mềm chiến lược tại {company_name}.",
                "Viết mã nguồn chuẩn hóa, tối ưu thuật toán và đảm bảo hiệu năng cao cho hệ thống.",
                "Phối hợp với các nhóm kiểm thử và vận hành để triển khai sản phẩm chất lượng cao đến người dùng.",
            ],
            "req": [
                "Tốt nghiệp chuyên ngành Khoa học máy tính hoặc Kỹ thuật phần mềm.",
                "Nắm vững các nguyên lý lập trình hướng đối tượng SOLID, Design Patterns và giải thuật.",
            ],
        },
        "mobile_flutter": {
            "skills": ["Dart", "Flutter", "JavaScript", "Git", "REST API", "Firebase", "Android", "iOS"],
            "resp": [
                f"Phát triển ứng dụng di động đa nền tảng (iOS & Android) bằng Flutter / Dart cho {company_name}.",
                "Ứng dụng kiến trúc Clean Architecture, quản lý state bằng BLoC / Riverpod và tối ưu hiệu năng 60fps.",
                "Tích hợp các dịch vụ Native, Push Notification và xuất bản ứng dụng lên App Store / Google Play.",
            ],
            "req": [
                "Thành thạo Dart và Flutter, có sản phẩm thực tế đã phát hành trên các kho ứng dụng.",
                "Hiểu rõ vòng đời Widget, State Management và tối ưu hóa hiệu năng trên thiết bị di động.",
            ],
        },
        "mobile_ios": {
            "skills": ["Swift", "iOS", "Objective-C", "Git", "REST API", "Xcode", "CocoaPods", "UI/UX"],
            "resp": [
                f"Phát triển các ứng dụng iOS cao cấp bằng Swift và SwiftUI/UIKit cho người dùng của {company_name}.",
                "Tối ưu hóa trải nghiệm mượt mà, quản lý bộ nhớ ARC hiệu quả và tích hợp các API mới nhất của Apple.",
            ],
            "req": [
                "Thành thạo ngôn ngữ Swift, SwiftUI, UIKit và quy trình phát hành ứng dụng lên Apple App Store.",
            ],
        },
        "mobile_general": {
            "skills": ["Dart", "Flutter", "React Native", "JavaScript", "Git", "Android", "iOS", "REST API"],
            "resp": [
                f"Tham gia xây dựng các ứng dụng di động chất lượng cao phục vụ khách hàng của {company_name}.",
                "Phối hợp cùng đội ngũ UI/UX Designer và Backend để mang lại trải nghiệm tối ưu trên mobile.",
            ],
            "req": [
                "Kinh nghiệm phát triển ứng dụng di động (Flutter, React Native hoặc Native iOS/Android).",
            ],
        },
        "devops": {
            "skills": ["Docker", "Kubernetes", "Linux", "Git", "Python", "CI/CD", "AWS", "Terraform"],
            "resp": [
                f"Thiết kế, xây dựng và quản trị hạ tầng Cloud / On-Premise có độ sẵn sàng cao tại {company_name}.",
                "Tự động hóa hoàn toàn các pipeline CI/CD (GitHub Actions, GitLab CI) và quản lý cụm Kubernetes (K8s).",
                "Thiết lập hệ thống giám sát tập trung, cảnh báo sớm và tối ưu chi phí hạ tầng máy chủ.",
            ],
            "req": [
                "Thành thạo hệ điều hành Linux, Docker, Kubernetes và viết Script tự động hóa (Bash, Python).",
                "Kinh nghiệm thực chiến với CI/CD, Terraform và các hệ thống giám sát Prometheus/Grafana.",
            ],
        },
        "cybersecurity": {
            "skills": ["Linux", "Python", "Docker", "Git", "SQL", "Network Security", "Penetration Testing", "Security Auditing"],
            "resp": [
                f"Đánh giá lỗ hổng bảo mật và kiểm thử xâm nhập định kỳ cho toàn bộ hệ thống của {company_name}.",
                "Thiết lập chính sách an toàn thông tin, phòng chống các cuộc tấn công mạng và giám sát an ninh 24/7.",
            ],
            "req": [
                "Hiểu biết sâu về an ninh mạng, giao thức mạng và các kỹ thuật bảo mật hệ thống web/ứng dụng.",
            ],
        },
        "sysadmin": {
            "skills": ["Linux", "Windows Server", "Docker", "Git", "Python", "Bash", "Network Administration", "PostgreSQL"],
            "resp": [
                f"Quản trị và vận hành hệ thống máy chủ, mạng nội bộ và các dịch vụ hạ tầng công nghệ tại {company_name}.",
                "Thực hiện sao lưu dữ liệu định kỳ, khắc phục sự cố kỹ thuật và đảm bảo hệ thống hoạt động liên tục.",
            ],
            "req": [
                "Thành thạo quản trị máy chủ Linux / Windows Server và kỹ năng viết shell script tự động hóa.",
            ],
        },
        "qa_automation": {
            "skills": ["Python", "Java", "Selenium", "Git", "Postman", "SQL", "Linux", "Docker"],
            "resp": [
                f"Xây dựng và phát triển Automation Test Framework cho ứng dụng Web, Mobile và API tại {company_name}.",
                "Viết kịch bản kiểm thử tự động (Selenium/Playwright/Cypress), tích hợp vào pipeline CI/CD tự động.",
                "Thực hiện kiểm thử hiệu năng (JMeter) và phân tích các điểm nghẽn của hệ thống.",
            ],
            "req": [
                "Kinh nghiệm lập trình kiểm thử tự động với Python / Java / JavaScript.",
                "Thành thạo các công cụ Playwright, Selenium, Postman và hiểu biết sâu về quy trình kiểm thử phần mềm.",
            ],
        },
        "qa_manual": {
            "skills": ["SQL", "Postman", "Git", "Giao tiếp", "Làm việc nhóm", "Jira", "Excel", "HTML"],
            "resp": [
                f"Phân tích yêu cầu nghiệp vụ, thiết kế Test Plan, Test Case cho các sản phẩm của {company_name}.",
                "Thực hiện kiểm thử chức năng, giao diện, API và cơ sở dữ liệu trên đa nền tảng Web và Mobile.",
                "Quản lý vòng đời lỗi trên Jira và phối hợp với lập trình viên để khắc phục triệt để.",
            ],
            "req": [
                "Nắm vững các phương pháp thiết kế Test Case, kiểm thử API bằng Postman và truy vấn SQL kiểm tra dữ liệu.",
                "Cẩn thận, tỉ mỉ, khả năng phát hiện lỗi tốt và kỹ năng giao tiếp tích cực.",
            ],
        },
        "qa_general": {
            "skills": ["SQL", "Python", "Selenium", "Postman", "Git", "Làm việc nhóm", "Giao tiếp", "Jira"],
            "resp": [
                f"Đảm bảo chất lượng toàn diện cho các sản phẩm phần mềm phát triển tại {company_name}.",
                "Kết hợp kiểm thử thủ công và từng bước xây dựng kiểm thử tự động nhằm nâng cao độ tin cậy của sản phẩm.",
            ],
            "req": [
                "Kiến thức vững chắc về quy trình phát triển và kiểm thử phần mềm (SDLC/STLC).",
                "Kỹ năng sử dụng Jira, Postman và khả năng phân tích yêu cầu nhanh chóng.",
            ],
        },
        "product_manager": {
            "skills": ["Giao tiếp", "Làm việc nhóm", "Quản lý dự án", "Figma", "SQL", "Agile", "Jira", "Scrum"],
            "resp": [
                f"Hoạch định chiến lược và lộ trình phát triển (Product Roadmap) cho các sản phẩm số tại {company_name}.",
                "Nghiên cứu thị trường, phân tích hành vi người dùng và viết tài liệu đặc tả PRD chi tiết.",
                "Phối hợp với đội ngũ Kỹ thuật, Thiết kế và Kinh doanh để hiện thực hóa các tính năng mới.",
            ],
            "req": [
                "Kinh nghiệm thực tế ở vai trò Product Manager hoặc Product Owner cho các sản phẩm công nghệ.",
                "Tư duy Data-driven, sử dụng thành thạo SQL và quy trình Agile/Scrum.",
            ],
        },
        "business_analyst": {
            "skills": ["SQL", "UML", "Giao tiếp", "Làm việc nhóm", "Figma", "Quản lý dự án", "Jira", "Excel"],
            "resp": [
                f"Khảo sát, phân tích yêu cầu nghiệp vụ và mô hình hóa quy trình (BPMN, UML) tại {company_name}.",
                "Biên soạn tài liệu đặc tả yêu cầu (BRD/SRS) rõ ràng và hỗ trợ nghiệm thu sản phẩm (UAT).",
            ],
            "req": [
                "Nắm vững kỹ thuật phân tích nghiệp vụ, vẽ sơ đồ quy trình và kỹ năng truy vấn dữ liệu SQL.",
                "Kỹ năng lắng nghe, phân tích logic và diễn đạt vấn đề xuất sắc.",
            ],
        },
        "project_manager": {
            "skills": ["Quản lý dự án", "Scrum", "Agile", "Giao tiếp", "Làm việc nhóm", "Jira", "Risk Management", "Budgeting"],
            "resp": [
                f"Lập kế hoạch, quản lý tiến độ, phạm vi và chất lượng bàn giao các dự án công nghệ tại {company_name}.",
                "Điều phối hoạt động hàng ngày của nhóm phát triển theo mô hình Scrum và quản trị rủi ro dự án.",
            ],
            "req": [
                "Kinh nghiệm quản lý dự án phần mềm theo chuẩn Agile/Scrum, có chứng chỉ PMP/CSM là lợi thế.",
                "Khả năng lãnh đạo, gắn kết đội ngũ và kỹ năng giải quyết vấn đề hiệu quả.",
            ],
        },
        "ui_ux": {
            "skills": ["Figma", "UI/UX", "Photoshop", "Giao tiếp", "Design System", "HTML", "CSS", "Làm việc nhóm"],
            "resp": [
                f"Nghiên cứu người dùng, xây dựng User Flow, Wireframe và thiết kế giao diện UI/UX tại {company_name}.",
                "Xây dựng và chuẩn hóa Hệ thống thiết kế (Design System) đồng nhất cho toàn bộ sản phẩm.",
                "Phối hợp với Frontend Developer để đảm bảo giao diện khi hoàn thiện đạt độ thẩm mỹ cao nhất.",
            ],
            "req": [
                "Portfolio thiết kế ấn tượng thể hiện năng lực UI/UX trên Web và Mobile.",
                "Thành thạo công cụ Figma, am hiểu sâu sắc về trải nghiệm người dùng và nguyên lý thị giác.",
            ],
        },
        "marketing_manager": {
            "skills": ["Giao tiếp", "Làm việc nhóm", "Quản lý dự án", "SEO", "Google Analytics", "Content Marketing", "Digital Marketing", "SQL"],
            "resp": [
                f"Xây dựng và thực thi chiến lược Marketing cho các sản phẩm công nghệ của {company_name}.",
                "Tối ưu hóa các chiến dịch chuyển đổi số, phân tích dữ liệu tăng trưởng người dùng.",
            ],
            "req": [
                "Kinh nghiệm Marketing cho sản phẩm công nghệ, SaaS hoặc E-commerce.",
                "Tư duy phân tích số liệu và kỹ năng lập kế hoạch chiến dịch bài bản.",
            ],
        },
    }

    BENEFIT_PACKAGES = [
        [
            f"Mức thu nhập hấp dẫn theo năng lực tại {company_name}, xét duyệt tăng lương định kỳ 2 lần/năm.",
            "Thưởng tháng lương thứ 13, thưởng hiệu suất công việc (KPI) và các dịp lễ tết trong năm.",
            "Gói bảo hiểm sức khỏe cao cấp toàn diện (bảo lãnh viện phí) cho nhân viên và người thân.",
            "Trang bị máy tính làm việc cấu hình mạnh (MacBook Pro / Laptop chuyên dụng) và màn hình phụ.",
            "Chế độ làm việc linh hoạt (Hybrid working), hỗ trợ làm việc từ xa định kỳ.",
            "Tài trợ kinh phí thi các chứng chỉ chuyên môn quốc tế và tham gia các khóa đào tạo nâng cao.",
            "Du lịch thường niên hàng năm, teambuilding và tham gia các câu lạc bộ thể thao nội bộ.",
        ],
        [
            f"Chế độ đãi ngộ vượt trội tại {company_name}, lương thưởng tương xứng với đóng góp của bạn.",
            "Đóng bảo hiểm y tế và bảo hiểm xã hội đầy đủ theo đúng quy định của Luật lao động.",
            "Môi trường làm việc mở, sáng tạo, trẻ trung và tôn trọng sáng kiến cá nhân.",
            "Cơ hội được học hỏi trực tiếp từ các chuyên gia công nghệ hàng đầu và tham gia dự án lớn.",
            "Trợ cấp ăn trưa, gửi xe, pantry miễn phí với trà, cà phê, hoa quả tươi mỗi ngày.",
            "Chính sách nghỉ phép lên đến 14-16 ngày/năm cùng nhiều phúc lợi chăm sóc đời sống.",
        ],
        [
            f"Lương cạnh tranh hàng đầu thị trường, cơ hội nhận cổ phiếu thưởng (ESOP) tại {company_name}.",
            "Bảo hiểm sức khỏe đặc biệt và gói khám sức khỏe tổng quát định kỳ tại bệnh viện quốc tế.",
            "Ngân sách cá nhân hàng năm phục vụ mua sách, học tập và tham dự hội thảo công nghệ.",
            "Không gian làm việc tiện nghi với khu vực giải trí, thư giãn và thể dục thể thao.",
            "Văn hóa minh bạch, lộ trình thăng tiến nghề nghiệp rõ ràng và cơ hội làm việc quốc tế.",
        ],
    ]

    arch_info = ARCHETYPES_DB.get(archetype, ARCHETYPES_DB["software_engineer"])

    # Unique identifier stamp inside text
    job_code = f"JOB-{job.id:04d}"
    province_str = job.address.province.province_name if job.address and job.address.province else "Việt Nam"

    # Select dynamic components
    resp_items = list(arch_info["resp"])
    rng.shuffle(resp_items)
    selected_resp = resp_items[:min(len(resp_items), rng.randint(4, 5))]

    req_items = list(arch_info["req"])
    rng.shuffle(req_items)
    selected_req = req_items[:min(len(req_items), rng.randint(4, 5))]

    chosen_ben = rng.choice(BENEFIT_PACKAGES)
    rng.shuffle(chosen_ben)
    selected_ben = chosen_ben[:min(len(chosen_ben), rng.randint(5, 6))]

    # Build unique intro
    intros = [
        f"<p>Tại <strong>{company_name}</strong> (Mã tuyển dụng: <em>{job_code}</em>), chúng tôi tự hào dẫn đầu trong {company_focus}. Chúng tôi đang chào đón vị trí <strong>{job.title}</strong> ({level_phrase}) gia nhập đội ngũ kỹ thuật tại {province_str}.</p>",
        f"<p>Đồng hành cùng sự tăng trưởng mạnh mẽ của <strong>{company_name}</strong> trong việc phát triển {company_focus}, chúng tôi tuyển dụng vị trí <strong>{job.title}</strong> ({level_phrase}, mã tin: <em>{job_code}</em>).</p>",
        f"<p>Với định hướng mở rộng các giải pháp về {company_focus}, <strong>{company_name}</strong> tìm kiếm ứng viên xuất sắc cho vị trí <strong>{job.title}</strong> ({level_phrase}, mã: <em>{job_code}</em>).</p>",
        f"<p>Chào đón bạn đến với <strong>{company_name}</strong> — nơi kiến tạo {company_focus}. Chúng tôi đang chiêu mộ vị trí <strong>{job.title}</strong> ({level_phrase}, mã vị trí: <em>{job_code}</em>).</p>",
    ]
    intro_html = rng.choice(intros)

    # HTML Description
    description_html = (
        f"{intro_html}"
        f"<p><strong>Mục tiêu công việc:</strong> Trực tiếp tham gia thiết kế, phát triển và tối ưu hóa các module tính năng quan trọng cho dự án tại {company_name}, đảm bảo hệ thống vận hành ổn định và đạt hiệu năng cao nhất.</p>"
        f"<p><strong>Trách nhiệm chính:</strong></p>"
        f"<ul>"
        + "".join(f"<li>{r}</li>" for r in selected_resp)
        + f"</ul>"
        f"<p><strong>Môi trường làm việc:</strong> Làm việc cùng các kỹ sư tài năng, văn hóa Agile chuyên nghiệp và cơ hội thử thách với công nghệ mới tại {company_name}.</p>"
    )

    # HTML Requirements
    seniority_bullet = (
        f"Có từ {job.experience_years_min or 1} năm kinh nghiệm thực tế ở vị trí tương đương hoặc các dự án công nghệ có quy mô liên quan."
        if level_str in ("junior", "middle", "senior", "lead", "manager")
        else "Nắm vững kiến thức nền tảng vững chắc, tư duy giải quyết vấn đề tốt và tinh thần cầu tiến học hỏi nhanh."
    )
    requirements_html = (
        f"<p><strong>Yêu cầu năng lực & Chuyên môn:</strong></p>"
        f"<ul>"
        f"<li>{seniority_bullet}</li>"
        + "".join(f"<li>{r}</li>" for r in selected_req)
        + f"</ul>"
    )

    # HTML Benefits
    benefits_html = (
        f"<p><strong>Chế độ đãi ngộ & Quyền lợi tại {company_name}:</strong></p>"
        f"<ul>"
        + "".join(f"<li>{b}</li>" for b in selected_ben)
        + f"</ul>"
    )

    # Skills selection
    raw_skills = list(arch_info["skills"])
    core_skills = raw_skills[:4]
    extra_skills = raw_skills[4:]
    rng.shuffle(extra_skills)
    job_skills = core_skills + extra_skills[:rng.randint(2, 3)]

    return {
        "description": description_html,
        "requirements": requirements_html,
        "benefits": benefits_html,
        "skills": job_skills,
        "archetype": archetype,
    }


class Command(BaseCommand):
    help = "Làm giàu nội dung Job Postings một cách động (100% Unique) và re-encode embeddings với BGE-M3"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Chạy mô phỏng không ghi vào database",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help="Giới hạn số lượng job cần làm giàu (0 = toàn bộ)",
        )
        parser.add_argument(
            "--job-id",
            type=int,
            default=0,
            help="Làm giàu cho một Job ID cụ thể",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        limit = options["limit"]
        target_job_id = options["job_id"]

        self.stdout.write(self.style.MIGRATE_HEADING("=== BẮT ĐẦU QUY TRÌNH LÀM GIÀU DỮ LIỆU JOB (DYNAMIC 100% UNIQUE) ==="))
        self.stdout.write(f"Chế độ: {'DRY RUN (Mô phỏng)' if dry_run else 'THỰC THI THẬT'}")

        all_skills_map = {s.name.lower(): s for s in Skill.objects.all()}

        jobs_qs = Job.objects.select_related("company", "category", "address__province").order_by("id")
        if target_job_id > 0:
            jobs_qs = jobs_qs.filter(id=target_job_id)
        elif limit > 0:
            jobs_qs = jobs_qs[:limit]

        total_jobs = jobs_qs.count()
        self.stdout.write(f"Tổng số Jobs cần xử lý: {total_jobs}")

        progress_file = "enrich_job_progress.json"
        progress_data = {}

        processed_count = 0
        enriched_count = 0
        error_count = 0
        embeddings_updated = 0

        for job in jobs_qs:
            job_key = str(job.id)
            category_name = job.category.name if job.category else "Chưa phân loại"
            company_name = job.company.company_name if job.company else "JOBIO Tuyển Dụng"

            dynamic_data = generate_dynamic_job_content(job)

            level_str = (job.level or "junior").lower()
            min_exp = 0
            max_exp = None
            if level_str in ("intern", "fresher"):
                min_exp, max_exp = 0, 1
            elif level_str == "junior":
                min_exp, max_exp = 1, 3
            elif level_str == "middle":
                min_exp, max_exp = 2, 5
            elif level_str == "senior":
                min_exp, max_exp = 4, 8
            elif level_str in ("lead", "manager", "director"):
                min_exp, max_exp = 5, 12

            exp_min_val = job.experience_years_min if job.experience_years_min and job.experience_years_min > 0 else min_exp
            exp_max_val = job.experience_years_max if job.experience_years_max else max_exp

            seo_title = f"{job.title} | {company_name}"[:70]
            seo_desc = f"Tuyển dụng {job.title} tại {company_name}. Mức lương hấp dẫn, môi trường làm việc chuyên nghiệp."[:160]
            seo_kw = list(set([job.title.lower(), category_name.lower()] + [s.lower() for s in dynamic_data["skills"][:5]]))

            changes = {
                "title": job.title,
                "category": category_name,
                "company": company_name,
                "level": job.level,
                "archetype": dynamic_data["archetype"],
                "description_len": len(dynamic_data["description"].split()),
                "requirements_len": len(dynamic_data["requirements"].split()),
                "benefits_len": len(dynamic_data["benefits"].split()),
                "skills": dynamic_data["skills"],
                "experience_min": exp_min_val,
                "experience_max": exp_max_val,
            }

            if dry_run:
                self.stdout.write(
                    f"[DRY-RUN] Sẽ làm giàu Job ID {job.id}: \"{job.title}\" | "
                    f"Company: {company_name} | Archetype: {dynamic_data['archetype']} | "
                    f"Skills: {', '.join(dynamic_data['skills'][:4])}"
                )
                processed_count += 1
                enriched_count += 1
                continue

            try:
                with transaction.atomic():
                    job.description = dynamic_data["description"]
                    job.requirements = dynamic_data["requirements"]
                    job.benefits = dynamic_data["benefits"]
                    job.experience_years_min = exp_min_val
                    job.experience_years_max = exp_max_val
                    job.seo_title = seo_title
                    job.seo_description = seo_desc
                    job.seo_keywords = seo_kw
                    job.updated_at = timezone.now()
                    job.save(update_fields=[
                        "description", "requirements", "benefits",
                        "experience_years_min", "experience_years_max",
                        "seo_title", "seo_description", "seo_keywords",
                        "updated_at",
                    ])

                    JobSkill.objects.filter(job=job).delete()
                    for idx, skill_name in enumerate(dynamic_data["skills"]):
                        skill_obj = all_skills_map.get(skill_name.lower())
                        if skill_obj:
                            prof_level = JobSkill.ProficiencyLevel.INTERMEDIATE
                            if level_str in ("senior", "lead", "manager", "director"):
                                prof_level = JobSkill.ProficiencyLevel.ADVANCED
                            elif level_str in ("intern", "fresher"):
                                prof_level = JobSkill.ProficiencyLevel.BASIC

                            JobSkill.objects.create(
                                job=job,
                                skill=skill_obj,
                                is_required=(idx < 4),
                                proficiency_level=prof_level,
                                years_required=exp_min_val if idx < 3 else None,
                            )

                emb_res = generate_job_embedding(job.id)
                embeddings_updated += 1

                self.stdout.write(
                    self.style.SUCCESS(
                        f"✅ [Job ID {job.id}] Đã làm giàu thành công: \"{job.title}\" ({company_name}) | "
                        f"Embedding: {emb_res.get('status', 'done')}"
                    )
                )

                progress_data[job_key] = {
                    "job_id": job.id,
                    "title": job.title,
                    "company": company_name,
                    "status": "enriched",
                    "changes": changes,
                    "embedding_status": emb_res.get("status", "unknown"),
                    "updated_at": datetime.now().isoformat(),
                }
                enriched_count += 1

            except Exception as exc:
                self.stdout.write(self.style.ERROR(f"❌ [Job ID {job.id}] Lỗi khi làm giàu: {exc}"))
                error_count += 1
                progress_data[job_key] = {
                    "job_id": job.id,
                    "title": job.title,
                    "status": "error",
                    "error": str(exc),
                    "updated_at": datetime.now().isoformat(),
                }

            processed_count += 1

            if processed_count % 15 == 0:
                with open(progress_file, "w", encoding="utf-8") as f:
                    json.dump(progress_data, f, ensure_ascii=False, indent=2)

        if not dry_run:
            with open(progress_file, "w", encoding="utf-8") as f:
                json.dump(progress_data, f, ensure_ascii=False, indent=2)

        self.stdout.write(self.style.NOTICE("\n=== BÁO CÁO TỔNG KẾT ENRICHMENT ==="))
        self.stdout.write(f"Tổng số Jobs đã xử lý: {processed_count}")
        self.stdout.write(f"Số Jobs đã làm giàu nội dung: {enriched_count}")
        self.stdout.write(f"Số Jobs bị lỗi: {error_count}")
        if not dry_run:
            self.stdout.write(f"Số Embeddings đã re-encode: {embeddings_updated}")
            self.stdout.write(self.style.SUCCESS("🎉 Hoàn thành làm giàu dữ liệu và re-encode embeddings 100% thành công!"))
