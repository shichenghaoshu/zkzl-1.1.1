import { Card } from "../components/Card";
import { Mascot } from "../components/Mascot";
import type { AppRoute } from "../data/routes";

type LegalPageProps = {
  kind: "privacy" | "terms" | "children" | "copyright";
  onNavigate: (route: AppRoute) => void;
};

const legalNav: Array<{ label: string; route: AppRoute; kind: LegalPageProps["kind"] }> = [
  { label: "隐私政策", route: "legalPrivacy", kind: "privacy" },
  { label: "用户协议", route: "legalTerms", kind: "terms" },
  { label: "儿童信息保护", route: "legalChildren", kind: "children" },
  { label: "版权说明", route: "legalCopyright", kind: "copyright" }
];

const pageCopy = {
  privacy: {
    title: "隐私政策",
    intro: "我们用尽量清楚的中文说明课游AI如何处理老师、学生和课堂相关信息。",
    sections: [
      {
        title: "我们收集哪些信息",
        items: [
          "老师端信息：姓名、学校/机构、班级名称、课件主题、课件内容、分享和使用记录。",
          "学生端信息：昵称、课堂参与记录、答题结果、得分、关卡进度。",
          "我们不强制学生注册，不要求学生填写手机号、身份证、人脸、家庭住址等敏感信息。"
        ]
      },
      {
        title: "我们如何使用信息",
        items: [
          "用于课堂互动、学习反馈、课件生成和课件改进。",
          "课堂记录仅用于老师查看班级参与情况和学习反馈。",
          "不会向第三方出售学生数据。"
        ]
      },
      {
        title: "数据保存与删除",
        items: [
          "课堂记录会尽量控制在教学需要范围内保存。",
          "老师可以申请删除班级或课堂记录。",
          "如需咨询或删除数据，请联系 support@keyouai.com。"
        ]
      }
    ]
  },
  terms: {
    title: "用户服务协议",
    intro: "使用课游AI前，请老师、机构和管理员了解以下服务规则。",
    sections: [
      {
        title: "产品用途",
        items: [
          "课游AI用于 AI 互动游戏课件生成、课堂互动、链接分享和班级反馈。",
          "AI 生成内容仅作为教学辅助，老师上课前应进行审核和必要修改。",
          "体验版功能可能根据产品测试和用户反馈调整。"
        ]
      },
      {
        title: "内容与行为要求",
        items: [
          "老师上传资料应确保有合法使用权。",
          "不得上传违法、不适宜未成年人、侵害他人权益的内容。",
          "不得利用平台作弊、刷分、攻击系统或干扰其他课堂。"
        ]
      },
      {
        title: "违规处理",
        items: [
          "平台可对违规内容、异常课堂或异常账号进行限制、删除或暂停处理。",
          "如有疑问，请联系 support@keyouai.com。"
        ]
      }
    ]
  },
  children: {
    title: "儿童个人信息保护说明",
    intro: "课游AI面向小学课堂时，默认采用最小化收集原则，帮助学生轻量、安全地参与课堂。",
    sections: [
      {
        title: "最小化参与",
        items: [
          "学生可以通过昵称或临时身份参与课堂，不需要注册账号。",
          "不鼓励学生填写真实姓名、手机号、家庭住址等个人敏感信息。",
          "不采集人脸、精确定位、通讯录、身份证号。"
        ]
      },
      {
        title: "课堂使用确认",
        items: [
          "学校或机构长期使用时，应由老师、学校或监护人确认使用场景。",
          "老师可以删除课堂记录，减少不必要的信息保存。",
          "平台不向学生投放商业广告。"
        ]
      },
      {
        title: "家长沟通",
        items: [
          "家长如对课堂链接、学生参与记录或数据删除有疑问，可以联系老师或平台。",
          "平台联系邮箱：support@keyouai.com。"
        ]
      }
    ]
  },
  copyright: {
    title: "版权与内容使用说明",
    intro: "课游AI尊重教材、教辅、课件、图片、音频和老师原创内容的合法权益。",
    sections: [
      {
        title: "老师与原权利人的内容",
        items: [
          "老师上传的课件、题目、资料版权归原权利人所有。",
          "平台不会主动公开老师上传资料。",
          "AI 生成课件供老师教学使用。"
        ]
      },
      {
        title: "公开分享注意事项",
        items: [
          "用户公开分享课件时，应确保不侵犯教材、教辅、图片、音频等版权。",
          "如引用第三方素材，请确认课堂使用和公开传播权限。",
          "若收到版权投诉，平台会协助核查和处理。"
        ]
      }
    ]
  }
} satisfies Record<LegalPageProps["kind"], { title: string; intro: string; sections: Array<{ title: string; items: string[] }> }>;

export function LegalPage({ kind, onNavigate }: LegalPageProps) {
  const page = pageCopy[kind];

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-skybrand sm:text-6xl">{page.title}</h1>
          <p className="mt-3 max-w-3xl text-lg font-bold leading-8 text-ink">{page.intro}</p>
        </div>
        <Mascot size={118} label="课游" />
      </section>

      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        <Card className="h-fit p-3">
          <nav className="grid gap-2" aria-label="合规说明导航">
            {legalNav.map((item) => (
              <button
                key={item.kind}
                className={[
                  "rounded-2xl px-4 py-3 text-left text-base font-black transition focus:outline-none focus:ring-4 focus:ring-blue-200",
                  item.kind === kind ? "bg-skybrand text-white" : "bg-white text-skybrand hover:bg-blue-50"
                ].join(" ")}
                onClick={() => onNavigate(item.route)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </Card>

        <div className="space-y-5">
          {page.sections.map((section) => (
            <Card key={section.title} className="p-6">
              <h2 className="text-2xl font-black text-ink">{section.title}</h2>
              <ul className="mt-4 space-y-3 text-base font-bold leading-8 text-slate-700">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-mintbrand" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
