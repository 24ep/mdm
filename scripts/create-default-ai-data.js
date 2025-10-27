const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createDefaultAIProviders() {
  console.log('Creating default AI providers...')
  
  const defaultProviders = [
    {
      provider: 'openai',
      name: 'OpenAI',
      description: 'OpenAI provides advanced AI models including GPT-4, GPT-3.5, and DALL-E',
      website: 'https://openai.com',
      icon: 'openai',
      isSupported: true,
      status: 'inactive',
      isConfigured: false
    },
    {
      provider: 'anthropic',
      name: 'Anthropic',
      description: 'Anthropic provides Claude models for advanced AI capabilities',
      website: 'https://anthropic.com',
      icon: 'anthropic',
      isSupported: true,
      status: 'inactive',
      isConfigured: false
    },
    {
      provider: 'google',
      name: 'Google AI',
      description: 'Google provides Gemini models for multimodal AI capabilities',
      website: 'https://ai.google',
      icon: 'google',
      isSupported: true,
      status: 'inactive',
      isConfigured: false
    },
    {
      provider: 'cohere',
      name: 'Cohere',
      description: 'Cohere provides language models for text generation and analysis',
      website: 'https://cohere.com',
      icon: 'cohere',
      isSupported: true,
      status: 'inactive',
      isConfigured: false
    },
    {
      provider: 'huggingface',
      name: 'Hugging Face',
      description: 'Hugging Face provides access to thousands of open-source AI models',
      website: 'https://huggingface.co',
      icon: 'huggingface',
      isSupported: true,
      status: 'inactive',
      isConfigured: false
    }
  ]

  for (const provider of defaultProviders) {
    try {
      await prisma.aIProviderConfig.upsert({
        where: { provider: provider.provider },
        update: provider,
        create: provider
      })
      console.log(`✓ Created/updated provider: ${provider.name}`)
    } catch (error) {
      console.error(`✗ Error creating provider ${provider.name}:`, error)
    }
  }
}

async function createDefaultAIModels() {
  console.log('Creating default AI models...')
  
  const defaultModels = [
    // OpenAI Models
    {
      name: 'GPT-4o',
      provider: 'openai',
      type: 'text',
      description: 'Most advanced GPT-4 model with vision capabilities',
      maxTokens: 128000,
      costPerToken: 0.00003,
      isAvailable: true,
      capabilities: ['text', 'vision', 'function-calling']
    },
    {
      name: 'GPT-4o Mini',
      provider: 'openai',
      type: 'text',
      description: 'Faster, cheaper GPT-4 model',
      maxTokens: 128000,
      costPerToken: 0.000015,
      isAvailable: true,
      capabilities: ['text', 'vision', 'function-calling']
    },
    {
      name: 'GPT-3.5 Turbo',
      provider: 'openai',
      type: 'text',
      description: 'Fast and efficient text generation',
      maxTokens: 16384,
      costPerToken: 0.000002,
      isAvailable: true,
      capabilities: ['text', 'function-calling']
    },
    // Anthropic Models
    {
      name: 'Claude 3.5 Sonnet',
      provider: 'anthropic',
      type: 'text',
      description: 'Most capable Claude model for complex tasks',
      maxTokens: 200000,
      costPerToken: 0.000003,
      isAvailable: true,
      capabilities: ['text', 'vision', 'code']
    },
    {
      name: 'Claude 3 Haiku',
      provider: 'anthropic',
      type: 'text',
      description: 'Fast and efficient Claude model',
      maxTokens: 200000,
      costPerToken: 0.00000025,
      isAvailable: true,
      capabilities: ['text', 'vision']
    },
    // Google Models
    {
      name: 'Gemini Pro',
      provider: 'google',
      type: 'multimodal',
      description: 'Google\'s advanced multimodal model',
      maxTokens: 30720,
      costPerToken: 0.0000005,
      isAvailable: true,
      capabilities: ['text', 'vision', 'code']
    },
    {
      name: 'Gemini Pro Vision',
      provider: 'google',
      type: 'multimodal',
      description: 'Google\'s vision-enabled model',
      maxTokens: 30720,
      costPerToken: 0.0000005,
      isAvailable: true,
      capabilities: ['text', 'vision']
    },
    // Cohere Models
    {
      name: 'Command',
      provider: 'cohere',
      type: 'text',
      description: 'Cohere\'s flagship text generation model',
      maxTokens: 4096,
      costPerToken: 0.0000015,
      isAvailable: true,
      capabilities: ['text', 'summarization']
    },
    {
      name: 'Command Light',
      provider: 'cohere',
      type: 'text',
      description: 'Faster, lighter version of Command',
      maxTokens: 4096,
      costPerToken: 0.0000003,
      isAvailable: true,
      capabilities: ['text']
    },
    // Hugging Face Models
    {
      name: 'Llama 2 70B',
      provider: 'huggingface',
      type: 'text',
      description: 'Meta\'s open-source large language model',
      maxTokens: 4096,
      costPerToken: 0.0000007,
      isAvailable: true,
      capabilities: ['text', 'code']
    },
    {
      name: 'Code Llama',
      provider: 'huggingface',
      type: 'text',
      description: 'Specialized model for code generation',
      maxTokens: 16384,
      costPerToken: 0.0000007,
      isAvailable: true,
      capabilities: ['code', 'text']
    }
  ]

  for (const model of defaultModels) {
    try {
      // Check if model already exists
      const existingModel = await prisma.aIModel.findFirst({
        where: {
          name: model.name,
          provider: model.provider
        }
      })

      if (!existingModel) {
        await prisma.aIModel.create({
          data: model
        })
      } else {
        await prisma.aIModel.update({
          where: { id: existingModel.id },
          data: model
        })
      }
      console.log(`✓ Created/updated model: ${model.name} (${model.provider})`)
    } catch (error) {
      console.error(`✗ Error creating model ${model.name}:`, error)
    }
  }
}

async function main() {
  try {
    await createDefaultAIProviders()
    await createDefaultAIModels()
    console.log('\n✅ Default AI providers and models created successfully!')
  } catch (error) {
    console.error('❌ Error creating default data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
