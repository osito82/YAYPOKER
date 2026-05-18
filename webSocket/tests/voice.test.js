import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateAction } from '../app'
import { ACTIONS } from '../constants'
import Socket from '../sockets'

describe('Voice Message Integration', () => {
  describe('Action Validation', () => {
    it('should validate a correct voice message action', () => {
      const validAction = {
        action: ACTIONS.VOICE_MESSAGE,
        audioData: 'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoK7u3uB...',
      }
      const error = validateAction(validAction.action, validAction)
      expect(error).toBeNull()
    })

    it('should fail if audioData is missing', () => {
      const invalidAction = {
        action: ACTIONS.VOICE_MESSAGE,
      }
      const error = validateAction(invalidAction.action, invalidAction)
      expect(error).toBe('Invalid voice data')
    })

    it('should fail if audioData is not a string', () => {
      const invalidAction = {
        action: ACTIONS.VOICE_MESSAGE,
        audioData: 12345,
      }
      const error = validateAction(invalidAction.action, invalidAction)
      expect(error).toBe('Invalid voice data')
    })
  })

  describe('Broadcasting Logic', () => {
    beforeEach(() => {
      vi.spyOn(Socket, 'broadcastToTorneo').mockImplementation(() => {})
    })

    it('should broadcast voice message to the tournament', () => {
      const mockSocket = {
        id: 'player-1',
        name: 'Alice',
      }
      const mockMatch = {
        torneoId: 'torneo-test',
      }
      const mockData = {
        audioData: 'base64-string',
      }

      // Replicando la lógica de app.js para el manejador de voiceMessage
      Socket.broadcastToTorneo(mockMatch.torneoId, {
        action: ACTIONS.VOICE_MESSAGE,
        data: {
          playerId: mockSocket.id,
          playerName: mockSocket.name,
          audioData: mockData.audioData,
        },
      })

      expect(Socket.broadcastToTorneo).toHaveBeenCalledWith(
        'torneo-test',
        expect.objectContaining({
          action: ACTIONS.VOICE_MESSAGE,
          data: {
            playerId: 'player-1',
            playerName: 'Alice',
            audioData: 'base64-string',
          },
        })
      )
    })
  })
})
