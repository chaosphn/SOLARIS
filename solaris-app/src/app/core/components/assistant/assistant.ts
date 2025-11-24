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
    'ช่วย list plant id มาให้หน่อยสิ',
    'ช่วยหาค่าล่าสุดของ J2301-1.INV011.EFF และ J2301-1.INV012.EFF ใน J2301-1 ให้หน่อยสิ',
    'ช่วยลิส tag ของ INV011 ใน J2301-1 ให้หน่อยสิว่ามี metric อะไรบ้าง',
    'ช่วยสรุปค่า J2301-1.INV021.WH_TODAY ย้อนหลัง 2 วันมาให้หน่อยสิ'
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
      this.userInput = '';
      this.chatMessages.update(prev => [...prev, chat]);
      this.loading.set(true);
      const res: any = await this.httpService.getAssistantMessage(
        chat.message,
        null
      );
      if(res && res.answer){
        this.loading.set(false);
        this.chatMessages.update(prev => [...prev, {
          role: 'answer',
          message: JSON.parse(res.answer).summary
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
