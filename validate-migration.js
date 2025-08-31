#!/usr/bin/env node

/**
 * Migration Validation Script
 * Validates that your Supabase migration is ready and working
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

class MigrationValidator {
    constructor() {
        this.supabase = createClient(supabaseUrl, supabaseServiceKey);
        this.errors = [];
        this.warnings = [];
        this.successes = [];
    }

    log(type, message) {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        }[type] || 'ℹ️';
        
        console.log(`${prefix} [${timestamp}] ${message}`);
        
        if (type === 'error') this.errors.push(message);
        if (type === 'warning') this.warnings.push(message);
        if (type === 'success') this.successes.push(message);
    }

    async validateEnvironment() {
        this.log('info', 'Validating environment variables...');
        
        const requiredVars = [
            'SUPABASE_URL',
            'SUPABASE_ANON_KEY', 
            'SUPABASE_SERVICE_KEY',
            'DB_HOST',
            'DB_USER',
            'DB_PASSWORD',
            'DB_NAME'
        ];

        let allPresent = true;
        requiredVars.forEach(varName => {
            if (!process.env[varName]) {
                this.log('error', `Missing environment variable: ${varName}`);
                allPresent = false;
            }
        });

        if (allPresent) {
            this.log('success', 'All required environment variables present');
        }

        return allPresent;
    }

    async validateSupabaseConnection() {
        this.log('info', 'Testing Supabase connection...');
        
        try {
            // Test basic connection
            const { data, error } = await this.supabase
                .from('users')
                .select('count')
                .limit(1);

            if (error && error.code === 'PGRST116') {
                this.log('error', 'Users table does not exist - schema not created');
                return false;
            } else if (error) {
                this.log('error', `Supabase connection error: ${error.message}`);
                return false;
            } else {
                this.log('success', 'Supabase connection successful');
                return true;
            }
        } catch (err) {
            this.log('error', `Connection failed: ${err.message}`);
            return false;
        }
    }

    async validateSchema() {
        this.log('info', 'Validating database schema...');
        
        const requiredTables = [
            'users', 'posts', 'alerts', 'comments', 
            'likes', 'checklist_progress', 'notifications'
        ];

        let allTablesExist = true;
        
        for (const table of requiredTables) {
            try {
                const { error } = await this.supabase
                    .from(table)
                    .select('*')
                    .limit(1);

                if (error && error.code === 'PGRST116') {
                    this.log('error', `Table missing: ${table}`);
                    allTablesExist = false;
                } else if (error) {
                    this.log('warning', `Table ${table}: ${error.message}`);
                } else {
                    this.log('success', `Table exists: ${table}`);
                }
            } catch (err) {
                this.log('error', `Error checking table ${table}: ${err.message}`);
                allTablesExist = false;
            }
        }

        return allTablesExist;
    }

    async validateBackendFiles() {
        this.log('info', 'Checking backend migration files...');
        
        const requiredFiles = [
            'backend/server-supabase.js',
            'backend/controllers/authController-supabase.js',
            'backend/db/supabase-connection.js',
            'backend/config/supabase.js'
        ];

        let allFilesExist = true;
        
        requiredFiles.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                this.log('success', `File exists: ${filePath}`);
            } else {
                this.log('error', `File missing: ${filePath}`);
                allFilesExist = false;
            }
        });

        return allFilesExist;
    }

    async validateFrontendSetup() {
        this.log('info', 'Checking frontend Supabase setup...');
        
        const frontendSupabaseFile = 'frontend/src/lib/supabase.js';
        
        if (fs.existsSync(frontendSupabaseFile)) {
            this.log('success', 'Frontend Supabase client exists');
            
            // Check if it has the right content
            const content = fs.readFileSync(frontendSupabaseFile, 'utf8');
            if (content.includes('createClient') && content.includes('VITE_SUPABASE_URL')) {
                this.log('success', 'Frontend Supabase client properly configured');
                return true;
            } else {
                this.log('warning', 'Frontend Supabase client may need updates');
                return false;
            }
        } else {
            this.log('error', 'Frontend Supabase client missing');
            return false;
        }
    }

    async runFullValidation() {
        console.log('🔍 Supabase Migration Validation');
        console.log('='.repeat(50));
        console.log(`📅 ${new Date().toLocaleString()}`);
        console.log(`🔗 Project: ${supabaseUrl}\n`);

        // Run all validations
        const envValid = await this.validateEnvironment();
        const connectionValid = await this.validateSupabaseConnection();
        const schemaValid = await this.validateSchema();
        const backendValid = await this.validateBackendFiles();
        const frontendValid = await this.validateFrontendSetup();

        // Summary
        console.log('\n📊 VALIDATION SUMMARY');
        console.log('='.repeat(30));
        console.log(`✅ Successes: ${this.successes.length}`);
        console.log(`⚠️  Warnings: ${this.warnings.length}`);
        console.log(`❌ Errors: ${this.errors.length}`);

        const overallValid = envValid && connectionValid && schemaValid && backendValid;

        if (overallValid) {
            console.log('\n🎉 MIGRATION READY!');
            console.log('✅ All critical components validated');
            console.log('🚀 You can proceed with the migration');
            
            console.log('\n📝 Next Steps:');
            console.log('1. cd backend && node switch-to-supabase.js');
            console.log('2. npm start (test backend)');
            console.log('3. cd frontend && npm run dev (test frontend)');
        } else {
            console.log('\n❌ MIGRATION NOT READY');
            console.log('🔧 Please fix the errors above before proceeding');
            
            if (!schemaValid) {
                console.log('\n🚨 CRITICAL: Database schema missing');
                console.log('📝 Go to Supabase dashboard and run essential-schema.sql');
            }
        }

        return overallValid;
    }
}

// Run validation if called directly
if (import.meta.url === `file://${__filename}`) {
    const validator = new MigrationValidator();
    validator.runFullValidation()
        .then((success) => {
            process.exit(success ? 0 : 1);
        })
        .catch((error) => {
            console.error('💥 Validation failed:', error);
            process.exit(1);
        });
}

export default MigrationValidator;
