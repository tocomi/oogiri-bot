export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      Team: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      Odai: {
        Row: {
          id: string
          teamId: string
          title: string
          type: string
          status: string
          dueDate: string
          imageUrl: string | null
          createdBy: string
          createdAt: string
        }
        Insert: {
          id: string
          teamId: string
          title: string
          type: string
          status: string
          dueDate: string
          imageUrl?: string | null
          createdBy: string
          createdAt: string
        }
        Update: {
          id?: string
          teamId?: string
          title?: string
          type?: string
          status?: string
          dueDate?: string
          imageUrl?: string | null
          createdBy?: string
          createdAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'Odai_teamId_fkey'
            columns: ['teamId']
            isOneToOne: false
            referencedRelation: 'Team'
            referencedColumns: ['id']
          },
        ]
      }
      Kotae: {
        Row: {
          id: string
          odaiId: string
          content: string
          createdBy: string
          createdAt: string
        }
        Insert: {
          id: string
          odaiId: string
          content: string
          createdBy: string
          createdAt: string
        }
        Update: {
          id?: string
          odaiId?: string
          content?: string
          createdBy?: string
          createdAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'Kotae_odaiId_fkey'
            columns: ['odaiId']
            isOneToOne: false
            referencedRelation: 'Odai'
            referencedColumns: ['id']
          },
        ]
      }
      Vote: {
        Row: {
          id: string
          odaiId: string
          kotaeId: string
          rank: number
          createdBy: string
          createdAt: string
        }
        Insert: {
          id: string
          odaiId: string
          kotaeId: string
          rank: number
          createdBy: string
          createdAt: string
        }
        Update: {
          id?: string
          odaiId?: string
          kotaeId?: string
          rank?: number
          createdBy?: string
          createdAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'Vote_odaiId_fkey'
            columns: ['odaiId']
            isOneToOne: false
            referencedRelation: 'Odai'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'Vote_kotaeId_fkey'
            columns: ['kotaeId']
            isOneToOne: false
            referencedRelation: 'Kotae'
            referencedColumns: ['id']
          },
        ]
      }
      Result: {
        Row: {
          id: string
          odaiId: string
          kotaeId: string
          type: string
          point: number
          rank: number
          createdAt: string
        }
        Insert: {
          id: string
          odaiId: string
          kotaeId: string
          type: string
          point: number
          rank: number
          createdAt: string
        }
        Update: {
          id?: string
          odaiId?: string
          kotaeId?: string
          type?: string
          point?: number
          rank?: number
          createdAt?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
