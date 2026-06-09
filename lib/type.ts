// Services
export interface Service {
    id: string
    title: string
    description: string
    icon: string
    order: number
  }
  
  // Portfolio
  export interface PortfolioItem {
    id: string
    title: string
    description: string
    category: 'video' | 'site' | 'app' | 'crm'
    imageKey: string
    videoUrl?: string
    client?: string
    date: string
  }
  
  // Tarifs
  export interface PricingPlan {
    id: string
    name: string
    price: number
    currency: string
    period: 'mois' | 'projet'
    features: string[]
    highlighted: boolean
  }
  
  // Blog
  export interface BlogPost {
    id: string
    title: string
    slug: string
    excerpt: string
    content: string
    imageKey?: string
    publishedAt: string
    published: boolean
  }
  
  // Contact
  export interface ContactMessage {
    id: string
    name: string
    email: string
    phone?: string
    subject: string
    message: string
    receivedAt: string
    read: boolean
  }
  
  // Config générale du site
  export interface SiteConfig {
    companyName: string
    tagline: string
    email: string
    phone: string
    address: string
    socialLinks: {
      instagram?: string
      linkedin?: string
      youtube?: string
      facebook?: string
    }
  }
  
  // Partenaires
  export interface Partner {
    id: string
    name: string
    email: string
    passwordHash: string
    role?: string
  prefix: string // ex: "partners/kevin/"
    createdAt: string
  }