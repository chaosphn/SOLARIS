import { Component, inject, signal } from '@angular/core';
import { FloatingDialogService } from '../../../shared/pipes/floating-dialog.service';
import { HttpService } from '../../../shared/services/http.service';

@Component({
  selector: 'app-assistant',
  standalone: false,
  templateUrl: './assistant.html',
  styleUrl: './assistant.scss'
})
export class Assistant {
  private dialogService = inject(FloatingDialogService);
  private httpService = inject(HttpService);

  close() {
    this.dialogService.close();
  }

  isOpen = false;
  userInput = '';
  suggestedPrompts = [
    'Get started with MongoDB',
    'How do I register for Atlas?',
    'How do you deploy a free cluster in Atlas?',
    'Why should I use Atlas Search?'
  ];
  chatMessages = signal<ChatMessageModel[]>([]);
  loading = signal<Boolean>(false);

  openDialog() {
    this.isOpen = true;
  }

  closeDialog() {
    this.isOpen = false;
  }

  selectPrompt(prompt: string) {
    this.userInput = prompt;
  }

  async sendMessage() {
    if (this.userInput.trim()) {
      const chat: ChatMessageModel = {
        role: 'question',
        message: this.userInput.trim()
      }
      this.chatMessages.update(prev => [...prev, chat]);
      this.loading.set(true);
      const res: any = await this.httpService.getAssistantMessage(
        chat.message,
        null
      );
      if(res && res.answer.text){
        this.loading.set(false);
        this.chatMessages.update(prev => [...prev, {
          role: 'answer',
          message: res.answer.text
        }]);
      } else {
        this.loading.set(false);
      }
      console.log('Sending message:', this.userInput);
      // ทำการส่งข้อความที่นี่
      this.userInput = '';
    }
  }
  
}

export interface ChatMessageModel{
  role: 'answer' | 'question';
  message: string;
}
