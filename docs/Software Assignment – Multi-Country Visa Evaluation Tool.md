**Software Assignment – Multi-Country Visa Evaluation Tool**

*You are allowed to use any AI tools given that you understand what AI wrote.*

## **Objective**

Design and build a prototype of a **multi-country visa evaluation tool** that helps users assess their likelihood of obtaining different types of visas (e.g., U.S., U.K., Canada, Europe, Australia).

This assignment evaluates your ability to:

* Interpret high-level product requirements  
* Design and implement a functional prototype with limited guidance  
* Demonstrate sound engineering, creativity, and independent thinking  
* Understands how you use AI in your daily coding to get things done

**Deadline:** One week after the task is given  
**Follow-up:** Code and product review discussion with the team

## **Background**

Our current tool ([https://evaluation.opensphere.ai/best-visa-for-you](https://evaluation.opensphere.ai/best-visa-for-you)) supports only U.S. visa categories such as O-1A, O-1B, and H-1B.

Some of our customers have integrated our tool on their website \- [Summit Legal](https://summit-legal.com/free-ai-visa-evaluation), [SMA Immigration](https://smaimmigration.com/)

 A new client has requested an expansion to cover additional countries and visa types, including Europe, Canada, Australia, and others.

Example new requirements include:

* Ireland – Critical Skills Employment Permit

* Poland – Work Permit Type C

* France – Talent Passport, Salarié en Mission

* Netherlands – Knowledge Migrant Permit

* Germany – EU Blue Card, ICT Permit

* (Existing) United States – O-1A, O-1B, H-1B

The goal is to extend the concept into a more flexible, data-driven, multi-country evaluation platform.

## **Scope of Work**

You will build a simplified but functional version of this tool. The application should:

1. **Support Multiple Countries and Visa Types**

   * Provide a list of countries and their corresponding visa categories.

   * Each visa type should specify required document types (e.g., résumé, personal statement, police report, employment contract).

2. **Collect and Validate User Inputs**

   * User information (name, email)

   * Country and visa type selection

   * Upload of required documents

3. **Generate an Evaluation Result**

   * Produce a visa evaluation score (0–100) and a short summary of reasoning or suggestions.

   * Implement a configurable maximum success cap (e.g., no score above 85%).

   * The evaluation logic may be rule-based or use an external AI API.

4. **Store Submissions**

   * Save all evaluations to a MongoDB database (or local JSON storage if MongoDB is unavailable).

5. **Partner / Lead Generation Support (Optional)**

   * Support partner API key access (e.g., via request header `x-api-key`).

   * Partners can view evaluations linked to their key.

   * A simple dashboard or JSON API view is sufficient.

6. **Result Display**

   * Display the evaluation score and summary on-screen.

   * Optionally, email results to the user using a library such as Nodemailer.

7. **Optional Enhancements**

   * Multi-language support

   * Partner dashboard with filters

   * Embed capability (iframe or widget script)

   * Integration with OpenAI or other APIs for text generation

## **Recommended Technology Stack**

* **Backend:** Node.js (Express)

* **Frontend:** Node.js \+ Tailwind CSS, or React \+ Tailwind

* **Database:** MongoDB

* **Optional:** AI/LLM integration (OpenAI, Claude, Gemini, etc.)

## **Deliverables**

* Working prototype that you can show to the end customer (live link)  
* Demo screenshots or a short Loom recording (optional)  
* For the interview calls \- prepare to explain your thought process and what you would improve with more time.   
